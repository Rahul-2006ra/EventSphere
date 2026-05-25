/**
 * EventSphere - Socket.IO Handler
 * Real-time: attendee count, check-ins, notifications, dashboard
 */

const prisma = require('./prisma');

// Track active rooms and connections
const activeRooms = new Map();

/**
 * Initialize Socket.IO event handlers
 */
function initSocketIO(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ─── Join event room (for live attendee count) ───
    socket.on('join:event', async (eventId) => {
      socket.join(`event:${eventId}`);
      console.log(`[Socket] ${socket.id} joined event:${eventId}`);

      // Send current attendee count
      try {
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          select: { bookedCount: true, totalCapacity: true },
        });
        if (event) {
          socket.emit('event:stats', {
            eventId,
            bookedCount: event.bookedCount,
            totalCapacity: event.totalCapacity,
            available: event.totalCapacity - event.bookedCount,
          });
        }
      } catch (err) {
        console.error('[Socket] Error fetching event stats:', err);
      }
    });

    // ─── Leave event room ───
    socket.on('leave:event', (eventId) => {
      socket.leave(`event:${eventId}`);
    });

    // ─── Join organizer dashboard ───
    socket.on('join:dashboard', (organizerId) => {
      socket.join(`dashboard:${organizerId}`);
      console.log(`[Socket] Organizer ${organizerId} joined dashboard`);
    });

    // ─── Join user notification channel ───
    socket.on('join:notifications', (userId) => {
      socket.join(`user:${userId}`);
    });

    // ─── Check-in via QR scan ───
    socket.on('checkin:scan', async ({ ticketNumber, eventId, scannedBy }) => {
      try {
        const ticket = await prisma.ticket.findUnique({
          where: { ticketNumber },
          include: {
            booking: { include: { user: true, event: true } },
            ticketType: true,
          },
        });

        if (!ticket) {
          socket.emit('checkin:result', { success: false, message: 'Invalid ticket' });
          return;
        }

        if (ticket.status === 'USED') {
          socket.emit('checkin:result', {
            success: false,
            message: 'Ticket already used',
            ticket: formatTicketInfo(ticket),
          });
          return;
        }

        if (ticket.status === 'CANCELLED') {
          socket.emit('checkin:result', { success: false, message: 'Ticket is cancelled' });
          return;
        }

        // Mark as checked in
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'USED',
            checkedInAt: new Date(),
            checkedInBy: scannedBy,
          },
        });

        const checkInData = {
          success: true,
          message: 'Check-in successful!',
          ticket: formatTicketInfo(ticket),
        };

        socket.emit('checkin:result', checkInData);

        // Broadcast to organizer dashboard
        const organizerId = ticket.booking.event.organizerId;
        io.to(`dashboard:${organizerId}`).emit('dashboard:checkin', {
          eventId: ticket.booking.eventId,
          attendeeName: ticket.attendeeName || ticket.booking.user.name,
          ticketType: ticket.ticketType.name,
          checkedInAt: new Date().toISOString(),
        });

        // Broadcast live check-in to event room
        io.to(`event:${eventId}`).emit('event:checkin', {
          attendeeName: ticket.attendeeName || ticket.booking.user.name,
          checkedInAt: new Date().toISOString(),
        });

      } catch (err) {
        console.error('[Socket] Check-in error:', err);
        socket.emit('checkin:result', { success: false, message: 'Server error during check-in' });
      }
    });

    // ─── Disconnect ───
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}

/**
 * Emit live ticket availability update to event room
 */
function emitTicketUpdate(io, eventId, stats) {
  io.to(`event:${eventId}`).emit('event:stats', stats);
}

/**
 * Emit notification to specific user
 */
function emitNotification(io, userId, notification) {
  io.to(`user:${userId}`).emit('notification:new', notification);
}

/**
 * Emit dashboard update to organizer
 */
function emitDashboardUpdate(io, organizerId, data) {
  io.to(`dashboard:${organizerId}`).emit('dashboard:update', data);
}

/**
 * Format ticket info for socket response
 */
function formatTicketInfo(ticket) {
  return {
    ticketNumber: ticket.ticketNumber,
    attendeeName: ticket.attendeeName || ticket.booking?.user?.name,
    eventName: ticket.booking?.event?.title,
    ticketType: ticket.ticketType?.name,
    status: ticket.status,
  };
}

module.exports = { initSocketIO, emitTicketUpdate, emitNotification, emitDashboardUpdate };
