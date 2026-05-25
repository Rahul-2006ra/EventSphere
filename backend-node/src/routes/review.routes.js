const express = require('express');
const router = express.Router();
const { createReview, getEventReviews, deleteReview } = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/', authenticate, createReview);
router.get('/event/:eventId', getEventReviews);
router.delete('/:id', authenticate, deleteReview);

module.exports = router;
