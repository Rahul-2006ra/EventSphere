/**
 * EventSphere - Ticket Routes
 */

const express = require('express');
const router = express.Router();
const {
  verifyTicket,
  checkInTicket,
  getTicketQR,
  getEventTickets,
} = require('../controllers/ticket.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/:ticketNumber/verify', authenticate, verifyTicket);
router.post('/:ticketNumber/checkin', authenticate, authorize('ORGANIZER', 'ADMIN'), checkInTicket);
router.get('/:id/qr', authenticate, getTicketQR);
router.get('/event/:eventId', authenticate, authorize('ORGANIZER', 'ADMIN'), getEventTickets);

module.exports = router;
