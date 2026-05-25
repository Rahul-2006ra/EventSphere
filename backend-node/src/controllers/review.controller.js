/**
 * EventSphere - Review Controller
 */

const prisma = require('../utils/prisma');

/**
 * POST /api/v1/reviews
 * Create or update a review (upsert)
 */
const createReview = async (req, res, next) => {
  try {
    const { eventId, rating, title, body } = req.body;

    if (!eventId || !rating || !body) {
      return res.status(400).json({ success: false, message: 'eventId, rating and body are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Verify user attended the event
    const booking = await prisma.booking.findFirst({
      where: { userId: req.user.id, eventId, status: 'CONFIRMED' },
    });

    const review = await prisma.review.upsert({
      where: { userId_eventId: { userId: req.user.id, eventId } },
      update: { rating: parseInt(rating), title, body },
      create: {
        userId: req.user.id,
        eventId,
        rating: parseInt(rating),
        title,
        body,
        isVerified: !!booking,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.json({ success: true, message: 'Review saved', data: review });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/reviews/event/:eventId
 */
const getEventReviews = async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { eventId: req.params.eventId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    const distribution = [1, 2, 3, 4, 5].reduce((acc, star) => {
      acc[star] = reviews.filter(r => r.rating === star).length;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        reviews,
        avgRating: Math.round(avg * 10) / 10,
        total: reviews.length,
        distribution,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/reviews/:id
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createReview, getEventReviews, deleteReview };
