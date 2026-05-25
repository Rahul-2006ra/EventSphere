/**
 * EventSphere - Event Routes
 */
const express = require('express');
const path = require('path');
const router = express.Router();
const {
  getEvents, getEvent, createEvent, updateEvent,
  deleteEvent, publishEvent, getMyEvents,
} = require('../controllers/event.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Public routes
router.get('/', optionalAuth, getEvents);
router.get('/organizer/my-events', authenticate, authorize('ORGANIZER', 'ADMIN'), getMyEvents);

// Banner image upload
router.post(
  '/upload-banner',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  upload.single('banner'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ success: true, data: { url: fileUrl, filename: req.file.filename } });
  }
);

router.get('/:idOrSlug', optionalAuth, getEvent);

// Protected routes
router.post('/', authenticate, authorize('ORGANIZER', 'ADMIN'), createEvent);
router.put('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), updateEvent);
router.delete('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), deleteEvent);
router.patch('/:id/publish', authenticate, authorize('ORGANIZER', 'ADMIN'), publishEvent);

module.exports = router;
