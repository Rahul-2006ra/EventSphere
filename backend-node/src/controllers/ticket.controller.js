/**
 * EventSphere - Ticket Controller
 * QR verification, check-in, ticket management
 */

const prisma = require('../utils/prisma');
const { emitDashboardUpdate } = require('../utils/socket');

/**
 * GET /api/v1/tickets/:ticketNumber/verify
 * Verify a ticket by its number (for check-in scanner)
 */
const verifyTicket = async (req, res, next) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            event: { select: { id: true, title: true, startDate: true, venue: true, organizerId: true } },
          },
        },
        ticketType: { select: { name: true, price: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({
      success: true,
      data: {
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        attendeeName: ticket.attendeeName || ticket.booking.user.name,
        attendeeEmail: ticket.attendeeEmail || ticket.booking.user.email,
        event: ticket.booking.event.title,
        eventId: ticket.booking.event.id,
        ticketType: ticket.ticketType.name,
        checkedInAt: ticket.checkedInAt,
        bookingId: ticket.bookingId,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/tickets/:ticketNumber/checkin
 * Manual check-in via API (alternative to Socket.IO)
 */
const checkInTicket = async (req, res, next) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        booking: {
          include: {
            event: { select: { id: true, title: true, organizerId: true } },
            user: { select: { name: true } },
          },
        },
        ticketType: { select: { name: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.status === 'USED') {
      return res.status(400).json({
        success: false,
        message: 'Ticket already used',
        data: { checkedInAt: ticket.checkedInAt },
      });
    }

    if (ticket.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Ticket is ${ticket.status.toLowerCase()} and cannot be checked in`,
      });
    }

    // Verify organizer owns this event
    if (
      ticket.booking.event.organizerId !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to check in for this event' });
    }

    // Mark as used
    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'USED',
        checkedInAt: new Date(),
        checkedInBy: req.user.id,
      },
    });

    // Emit real-time dashboard update
    const io = req.app.get('io');
    emitDashboardUpdate(io, ticket.booking.event.organizerId, {
      type: 'checkin',
      eventId: ticket.booking.event.id,
      attendeeName: ticket.attendeeName || ticket.booking.user.name,
      ticketType: ticket.ticketType.name,
      checkedInAt: updated.checkedInAt,
    });

    res.json({
      success: true,
      message: 'Check-in successful',
      data: {
        ticketNumber: ticket.ticketNumber,
        attendeeName: ticket.attendeeName || ticket.booking.user.name,
        ticketType: ticket.ticketType.name,
        checkedInAt: updated.checkedInAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/tickets/:id/qr
 * Get QR code for a specific ticket (owner only)
 */
const getTicketQR = async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        booking: { select: { userId: true } },
        ticketType: { select: { name: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Only the ticket owner or admin can view QR
    if (ticket.booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: {
        ticketNumber: ticket.ticketNumber,
        qrCode: ticket.qrCode,
        qrData: ticket.qrData,
        ticketType: ticket.ticketType.name,
        status: ticket.status,
        checkedInAt: ticket.checkedInAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/tickets/event/:eventId
 * List all tickets for an event (organizer only)
 */
const getEventTickets = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify organizer owns the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const where = {
      booking: { eventId },
      ...(status && { status }),
    };

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          ticketType: { select: { name: true, price: true } },
          booking: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        tickets: tickets.map(t => ({
          id: t.id,
          ticketNumber: t.ticketNumber,
          attendeeName: t.attendeeName || t.booking.user.name,
          attendeeEmail: t.attendeeEmail || t.booking.user.email,
          ticketType: t.ticketType.name,
          status: t.status,
          checkedInAt: t.checkedInAt,
          createdAt: t.createdAt,
        })),
        pagination: { total, page: parseInt(page), limit: parseInt(limit) },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { verifyTicket, checkInTicket, getTicketQR, getEventTickets };
