const express = require('express');
const router = express.Router();
const { getOverview, getEventDashboard } = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/overview', authorize('ORGANIZER', 'ADMIN'), getOverview);
router.get('/event/:eventId', authorize('ORGANIZER', 'ADMIN'), getEventDashboard);

module.exports = router;
