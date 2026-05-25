/**
 * EventSphere - User Controller
 * Profile, stats, organizer public profile
 */

const prisma = require('../utils/prisma');

/**
 * GET /api/v1/users/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            events: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/users/:id/public
 * Public organizer profile
 */
const getPublicProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        _count: { select: { events: true } },
      },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Only show organizer public profiles
    if (user.role === 'ATTENDEE') {
      return res.status(403).json({ success: false, message: 'Profile not public' });
    }

    // Get their published events
    const events = await prisma.event.findMany({
      where: { organizerId: req.params.id, status: 'PUBLISHED' },
      take: 6,
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        bannerImage: true,
        startDate: true,
        city: true,
        category: true,
        bookedCount: true,
        totalCapacity: true,
      },
    });

    res.json({ success: true, data: { ...user, events } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/users/stats
 * Current user activity stats
 */
const getUserStats = async (req, res, next) => {
  try {
    const [totalBookings, upcomingEvents, wishlistCount, reviewCount] = await Promise.all([
      prisma.booking.count({ where: { userId: req.user.id, status: 'CONFIRMED' } }),
      prisma.booking.count({
        where: {
          userId: req.user.id,
          status: 'CONFIRMED',
          event: { startDate: { gte: new Date() } },
        },
      }),
      prisma.wishlist.count({ where: { userId: req.user.id } }),
      prisma.review.count({ where: { userId: req.user.id } }),
    ]);

    res.json({
      success: true,
      data: { totalBookings, upcomingEvents, wishlistCount, reviewCount },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, getPublicProfile, getUserStats };
