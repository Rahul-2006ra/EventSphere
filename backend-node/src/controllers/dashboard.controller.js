/**
 * EventSphere - Dashboard Controller
 * Organizer analytics: revenue, sales, check-ins, performance
 */

const prisma = require('../utils/prisma');

/**
 * GET /api/v1/dashboard/overview
 * Main organizer dashboard stats
 */
const getOverview = async (req, res, next) => {
  try {
    const organizerId = req.user.id;

    // Get all organizer events
    const events = await prisma.event.findMany({
      where: { organizerId },
      select: { id: true },
    });
    const eventIds = events.map((e) => e.id);

    if (eventIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalRevenue: 0, totalTicketsSold: 0, totalBookings: 0,
          totalCheckIns: 0, totalEvents: 0, upcomingEvents: 0,
          recentBookings: [], eventPerformance: [],
        },
      });
    }

    const [
      revenueResult,
      totalTicketsSold,
      totalBookings,
      totalCheckIns,
      totalEvents,
      upcomingEvents,
      recentBookings,
      eventPerformance,
    ] = await Promise.all([
      // Total revenue
      prisma.booking.aggregate({
        where: { eventId: { in: eventIds }, status: 'CONFIRMED' },
        _sum: { totalAmount: true },
      }),
      // Total tickets sold
      prisma.ticket.count({
        where: { booking: { eventId: { in: eventIds }, status: 'CONFIRMED' } },
      }),
      // Total bookings
      prisma.booking.count({
        where: { eventId: { in: eventIds }, status: 'CONFIRMED' },
      }),
      // Total check-ins
      prisma.ticket.count({
        where: { booking: { eventId: { in: eventIds } }, status: 'USED' },
      }),
      // Total events
      prisma.event.count({ where: { organizerId } }),
      // Upcoming events
      prisma.event.count({
        where: { organizerId, status: 'PUBLISHED', startDate: { gte: new Date() } },
      }),
      // Recent bookings (last 10)
      prisma.booking.findMany({
        where: { eventId: { in: eventIds }, status: 'CONFIRMED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          event: { select: { id: true, title: true } },
        },
      }),
      // Event performance
      prisma.event.findMany({
        where: { organizerId, status: { in: ['PUBLISHED', 'COMPLETED'] } },
        include: {
          _count: { select: { bookings: true } },
          ticketTypes: true,
        },
        orderBy: { startDate: 'desc' },
        take: 5,
      }),
    ]);

    // Monthly revenue for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyBookings = await prisma.booking.findMany({
      where: {
        eventId: { in: eventIds },
        status: 'CONFIRMED',
        createdAt: { gte: sixMonthsAgo },
      },
      select: { totalAmount: true, createdAt: true },
    });

    // Group by month
    const monthlyRevenue = {};
    monthlyBookings.forEach((b) => {
      const month = b.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + b.totalAmount;
    });

    res.json({
      success: true,
      data: {
        totalRevenue: revenueResult._sum.totalAmount || 0,
        totalTicketsSold,
        totalBookings,
        totalCheckIns,
        totalEvents,
        upcomingEvents,
        recentBookings,
        eventPerformance: eventPerformance.map((e) => ({
          id: e.id,
          title: e.title,
          startDate: e.startDate,
          totalCapacity: e.totalCapacity,
          bookedCount: e.bookedCount,
          revenue: e.ticketTypes.reduce((sum, tt) => sum + (tt.price * tt.sold), 0),
          bookingCount: e._count.bookings,
        })),
        monthlyRevenue: Object.entries(monthlyRevenue)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, revenue]) => ({ month, revenue })),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/dashboard/event/:eventId
 * Single event detailed analytics
 */
const getEventDashboard = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ticketTypes: true,
        reviews: { select: { rating: true } },
      },
    });

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const [bookings, checkIns, revenue] = await Promise.all([
      prisma.booking.count({ where: { eventId, status: 'CONFIRMED' } }),
      prisma.ticket.count({ where: { booking: { eventId }, status: 'USED' } }),
      prisma.booking.aggregate({
        where: { eventId, status: 'CONFIRMED' },
        _sum: { totalAmount: true },
      }),
    ]);

    // Recent attendees with check-in status
    const recentAttendees = await prisma.ticket.findMany({
      where: { booking: { eventId, status: 'CONFIRMED' } },
      include: {
        booking: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        ticketType: { select: { name: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const avgRating =
      event.reviews.length > 0
        ? event.reviews.reduce((sum, r) => sum + r.rating, 0) / event.reviews.length
        : 0;

    res.json({
      success: true,
      data: {
        event: {
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          status: event.status,
          totalCapacity: event.totalCapacity,
          bookedCount: event.bookedCount,
        },
        stats: {
          bookings,
          checkIns,
          revenue: revenue._sum.totalAmount || 0,
          checkInRate: bookings > 0 ? Math.round((checkIns / bookings) * 100) : 0,
          avgRating: Math.round(avgRating * 10) / 10,
          totalReviews: event.reviews.length,
        },
        ticketBreakdown: event.ticketTypes.map((tt) => ({
          name: tt.name,
          price: tt.price,
          sold: tt.sold,
          available: tt.quantity - tt.sold,
          revenue: tt.price * tt.sold,
        })),
        recentAttendees: recentAttendees.map((t) => ({
          ticketNumber: t.ticketNumber,
          attendeeName: t.attendeeName || t.booking.user.name,
          ticketType: t.ticketType.name,
          status: t.status,
          checkedInAt: t.checkedInAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getOverview, getEventDashboard };
