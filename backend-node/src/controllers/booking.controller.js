/**
 * EventSphere - Booking Controller
 * Multi-ticket booking, Razorpay payment, QR generation
 */

const Razorpay = require('razorpay');
const axios = require('axios');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../utils/prisma');
const { emitTicketUpdate, emitNotification, emitDashboardUpdate } = require('../utils/socket');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const hasRazorpayKeys = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const createRazorpayOrder = async ({ amount, receipt, notes }) => {
  const response = await axios.post(
    'https://api.razorpay.com/v1/orders',
    {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt,
      notes,
    },
    {
      auth: {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET,
      },
      timeout: 20000,
    },
  );
  return response.data;
};

const toPendingTicketPayload = (ticketValidations) => ticketValidations.map((t) => ({
  ticketTypeId: t.ticketType.id,
  quantity: t.quantity,
  attendees: t.attendees || [],
}));

/**
 * Generate unique ticket number
 */
const generateTicketNumber = () => {
  return `EVS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

/**
 * POST /api/v1/bookings/initiate
 * Step 1: Validate tickets + create Razorpay order
 */
const initiateBooking = async (req, res, next) => {
  try {
    const { eventId, tickets, attendeeDetails } = req.body;
    // tickets: [{ ticketTypeId, quantity, attendees: [{name, email}] }]

    if (!tickets || tickets.length === 0) {
      return res.status(400).json({ success: false, message: 'No tickets selected' });
    }

    // Validate event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true },
    });

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.status !== 'PUBLISHED') {
      return res.status(400).json({ success: false, message: 'Event is not available for booking' });
    }

    // Validate ticket availability and calculate total
    let totalAmount = 0;
    const ticketValidations = [];

    for (const item of tickets) {
      const ticketType = event.ticketTypes.find((tt) => tt.id === item.ticketTypeId);
      if (!ticketType) {
        return res.status(400).json({ success: false, message: `Ticket type not found` });
      }
      if (!ticketType.isActive) {
        return res.status(400).json({ success: false, message: `${ticketType.name} tickets are not available` });
      }

      const available = ticketType.quantity - ticketType.sold;
      if (item.quantity > available) {
        return res.status(400).json({
          success: false,
          message: `Only ${available} ${ticketType.name} tickets available`,
        });
      }
      if (item.quantity > ticketType.maxPerOrder) {
        return res.status(400).json({
          success: false,
          message: `Max ${ticketType.maxPerOrder} tickets per order for ${ticketType.name}`,
        });
      }

      totalAmount += ticketType.price * item.quantity;
      ticketValidations.push({ ticketType, quantity: item.quantity, attendees: item.attendees || [] });
    }

    // Handle free events
    if (totalAmount === 0) {
      return confirmFreeBooking(req, res, { eventId, event, ticketValidations, attendeeDetails });
    }

    if (!hasRazorpayKeys) {
      const booking = await prisma.booking.create({
        data: {
          totalAmount,
          currency: 'INR',
          status: 'PENDING',
          userId: req.user.id,
          eventId,
          attendeeDetails: {
            ...attendeeDetails,
            pendingTickets: toPendingTicketPayload(ticketValidations),
          },
        },
      });

      return res.json({
        success: true,
        message: 'Payment pending. Add Razorpay keys to enable checkout.',
        data: {
          bookingId: booking.id,
          bookingRef: booking.bookingRef,
          status: booking.status,
          amount: totalAmount,
          totalAmount,
          currency: 'INR',
          paymentAvailable: false,
          keyId: '',
          orderId: null,
          event: { title: event.title, bannerImage: event.bannerImage },
          tickets: [],
        },
      });
    }

    // Create Razorpay order (amount in paise)
    const razorpayOrder = await createRazorpayOrder({
      amount: totalAmount,
      receipt: `order_${Date.now()}`,
      notes: {
        eventId,
        userId: req.user.id,
        eventTitle: event.title,
      },
    });

    // Store pending booking data in DB
    const booking = await prisma.booking.create({
      data: {
        orderId: razorpayOrder.id,
        totalAmount,
        currency: 'INR',
        status: 'PENDING',
        userId: req.user.id,
        eventId,
        attendeeDetails: {
          ...attendeeDetails,
          pendingTickets: toPendingTicketPayload(ticketValidations),
        },
      },
    });

    res.json({
      success: true,
      data: {
        bookingId: booking.id,
        orderId: razorpayOrder.id,
        amount: totalAmount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        paymentAvailable: true,
        event: { title: event.title, bannerImage: event.bannerImage },
        tickets: ticketValidations.map((t) => ({
          ticketTypeId: t.ticketType.id,
          name: t.ticketType.name,
          price: t.ticketType.price,
          quantity: t.quantity,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/bookings/verify
 * Step 2: Verify Razorpay payment signature and confirm booking
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { bookingId, orderId, paymentId, signature } = req.body;

    if (!hasRazorpayKeys) {
      return res.status(400).json({
        success: false,
        message: 'Payment gateway is not configured. Booking remains pending.',
      });
    }

    if (!bookingId || !orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details. Booking remains pending.',
      });
    }

    const pendingBooking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: req.user.id },
      include: { event: { include: { organizer: true } }, tickets: true },
    });

    if (!pendingBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (pendingBooking.status === 'CONFIRMED') {
      return res.json({
        success: true,
        message: 'Booking already confirmed',
        data: pendingBooking,
      });
    }

    if (pendingBooking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Booking is ${pendingBooking.status.toLowerCase()} and cannot be confirmed`,
      });
    }

    if (pendingBooking.orderId !== orderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment order does not match this booking. Booking remains pending.',
      });
    }

    // Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Booking remains pending.',
      });
    }

    const tickets = pendingBooking.attendeeDetails?.pendingTickets || [];
    if (!tickets.length) {
      return res.status(400).json({
        success: false,
        message: 'No pending tickets found for this booking. Booking remains pending.',
      });
    }

    // Generate tickets and QR codes in transaction
    const booking = await prisma.$transaction(async (tx) => {
      for (const item of tickets) {
        const ticketType = await tx.ticketType.findUnique({ where: { id: item.ticketTypeId } });
        if (!ticketType) throw new Error('Ticket type not found');
        if (!ticketType.isActive) throw new Error(`${ticketType.name} tickets are not available`);
        if (item.quantity > ticketType.quantity - ticketType.sold) {
          throw new Error(`Only ${ticketType.quantity - ticketType.sold} ${ticketType.name} tickets available`);
        }
      }

      // Update booking
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          paymentId,
          orderId,
          paymentSignature: signature,
          paymentMethod: 'razorpay',
          paidAt: new Date(),
        },
        include: { event: { include: { organizer: true } } },
      });

      // Create individual tickets with QR codes
      const createdTickets = [];

      for (const item of tickets) {
        const ticketType = await tx.ticketType.findUnique({ where: { id: item.ticketTypeId } });

        for (let i = 0; i < item.quantity; i++) {
          const ticketNumber = generateTicketNumber();
          const attendee = item.attendees?.[i] || {};

          // QR data payload
          const qrData = JSON.stringify({
            ticketNumber,
            eventId: updatedBooking.eventId,
            bookingId,
            ticketTypeId: item.ticketTypeId,
            issuedAt: new Date().toISOString(),
          });

          // Generate QR code as base64
          const qrCodeBase64 = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            width: 300,
            margin: 2,
            color: { dark: '#1a1a2e', light: '#ffffff' },
          });

          const ticket = await tx.ticket.create({
            data: {
              ticketNumber,
              qrCode: qrCodeBase64,
              qrData,
              status: 'ACTIVE',
              attendeeName: attendee.name || updatedBooking.event.title,
              attendeeEmail: attendee.email || null,
              bookingId,
              ticketTypeId: item.ticketTypeId,
            },
          });

          // Update ticket type sold count
          await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: { sold: { increment: 1 } },
          });

          createdTickets.push(ticket);
        }
      }

      // Update event booked count
      const totalTickets = tickets.reduce((sum, t) => sum + t.quantity, 0);
      await tx.event.update({
        where: { id: updatedBooking.eventId },
        data: { bookedCount: { increment: totalTickets } },
      });

      // Create notification
      await tx.notification.create({
        data: {
          type: 'BOOKING_CONFIRMED',
          title: 'Booking Confirmed! 🎉',
          message: `Your booking for "${updatedBooking.event.title}" is confirmed. ${totalTickets} ticket(s) issued.`,
          userId: updatedBooking.userId,
          data: { bookingId, eventId: updatedBooking.eventId },
        },
      });

      return { ...updatedBooking, tickets: createdTickets };
    });

    // Real-time updates
    const io = req.app.get('io');
    const event = await prisma.event.findUnique({ where: { id: booking.eventId } });

    emitTicketUpdate(io, booking.eventId, {
      eventId: booking.eventId,
      bookedCount: event.bookedCount,
      totalCapacity: event.totalCapacity,
      available: event.totalCapacity - event.bookedCount,
    });

    emitNotification(io, booking.userId, {
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed!',
      message: `Your tickets are ready for ${booking.event.title}`,
    });

    emitDashboardUpdate(io, booking.event.organizerId, {
      type: 'new_booking',
      bookingId: booking.id,
      amount: booking.totalAmount,
      eventId: booking.eventId,
    });

    res.json({
      success: true,
      message: 'Payment verified. Booking confirmed!',
      data: {
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        status: booking.status,
        totalAmount: booking.totalAmount,
        tickets: booking.tickets,
        event: booking.event,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle free event bookings (no payment needed)
 */
const confirmFreeBooking = async (req, res, { eventId, event, ticketValidations, attendeeDetails }) => {
  try {
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          status: 'CONFIRMED',
          totalAmount: 0,
          userId: req.user.id,
          eventId,
          attendeeDetails,
          paidAt: new Date(),
        },
      });

      const createdTickets = [];
      for (const item of ticketValidations) {
        for (let i = 0; i < item.quantity; i++) {
          const ticketNumber = generateTicketNumber();
          const qrData = JSON.stringify({ ticketNumber, eventId, bookingId: newBooking.id });
          const qrCodeBase64 = await QRCode.toDataURL(qrData, { width: 300 });

          const ticket = await tx.ticket.create({
            data: {
              ticketNumber, qrCode: qrCodeBase64, qrData,
              status: 'ACTIVE',
              attendeeName: item.attendees?.[i]?.name || null,
              attendeeEmail: item.attendees?.[i]?.email || null,
              bookingId: newBooking.id,
              ticketTypeId: item.ticketType.id,
            },
          });
          createdTickets.push(ticket);
          await tx.ticketType.update({ where: { id: item.ticketType.id }, data: { sold: { increment: 1 } } });
        }
      }

      const totalTickets = ticketValidations.reduce((sum, t) => sum + t.quantity, 0);
      await tx.event.update({ where: { id: eventId }, data: { bookedCount: { increment: totalTickets } } });

      return { ...newBooking, tickets: createdTickets };
    });

    res.status(201).json({
      success: true,
      message: 'Free booking confirmed!',
      data: { bookingId: booking.id, bookingRef: booking.bookingRef, status: 'CONFIRMED', tickets: booking.tickets },
    });
  } catch (err) {
    console.error('[FreeBooking] Error:', err);
    res.status(500).json({ success: false, message: 'Booking failed' });
  }
};

/**
 * GET /api/v1/bookings
 * Get user's bookings
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            select: { id: true, title: true, bannerImage: true, startDate: true, venue: true, city: true },
          },
          tickets: { include: { ticketType: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ success: true, data: { bookings, pagination: { total, page: parseInt(page), limit: parseInt(limit) } } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/bookings/:id
 */
const getBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        event: true,
        tickets: { include: { ticketType: true } },
      },
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/bookings/:id/cancel
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { event: true },
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'Only confirmed bookings can be cancelled' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: req.body.reason || 'User cancelled' },
      });
      await tx.ticket.updateMany({ where: { bookingId: booking.id }, data: { status: 'CANCELLED' } });
    });

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { initiateBooking, verifyPayment, getMyBookings, getBooking, cancelBooking };
