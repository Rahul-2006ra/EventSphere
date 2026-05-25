/**
 * EventSphere - Wishlist Controller
 */

const prisma = require('../utils/prisma');

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          include: {
            organizer: { select: { id: true, name: true } },
            ticketTypes: {
              where: { isActive: true },
              orderBy: { price: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: wishlist });
  } catch (err) { next(err); }
};

const toggleWishlist = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Check event exists
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const existing = await prisma.wishlist.findUnique({
      where: { userId_eventId: { userId: req.user.id, eventId } },
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return res.json({ success: true, data: { wishlisted: false, message: 'Removed from wishlist' } });
    }

    await prisma.wishlist.create({ data: { userId: req.user.id, eventId } });
    res.json({ success: true, data: { wishlisted: true, message: 'Added to wishlist' } });
  } catch (err) { next(err); }
};

const checkWishlist = async (req, res, next) => {
  try {
    const item = await prisma.wishlist.findUnique({
      where: { userId_eventId: { userId: req.user.id, eventId: req.params.eventId } },
    });
    res.json({ success: true, data: { wishlisted: !!item } });
  } catch (err) { next(err); }
};

module.exports = { getWishlist, toggleWishlist, checkWishlist };
