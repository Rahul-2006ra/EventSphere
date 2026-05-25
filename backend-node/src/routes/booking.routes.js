/**
 * EventSphere - Booking Routes
 */
const express = require('express');
const router = express.Router();
const { initiateBooking, verifyPayment, getMyBookings, getBooking, cancelBooking } = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/initiate', initiateBooking);
router.post('/verify', verifyPayment);
router.get('/', getMyBookings);
router.get('/:id', getBooking);
router.post('/:id/cancel', cancelBooking);

module.exports = router;
