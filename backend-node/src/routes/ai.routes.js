/**
 * EventSphere - AI Routes
 * Proxies requests to Flask AI microservice
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const FLASK_URL = process.env.FLASK_AI_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');

const proxyToFlask = async (endpoint, data, res, next) => {
  try {
    if (!FLASK_URL) {
      return res.status(503).json({ success: false, message: 'AI service URL is not configured' });
    }

    const response = await axios.post(`${FLASK_URL}${endpoint}`, data, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ success: false, message: 'AI service unavailable' });
    }
    next(err);
  }
};

// POST /api/v1/ai/generate-description
router.post('/generate-description', authenticate, authorize('ORGANIZER', 'ADMIN'), async (req, res, next) => {
  const { title, category, venue, date, speakers } = req.body;
  await proxyToFlask('/ai/generate-description', { title, category, venue, date, speakers }, res, next);
});

// POST /api/v1/ai/recommendations
router.post('/recommendations', authenticate, async (req, res, next) => {
  const { userId, interests, location, pastEvents } = req.body;
  await proxyToFlask('/ai/recommendations', { userId, interests, location, pastEvents }, res, next);
});

// POST /api/v1/ai/schedule
router.post('/schedule', authenticate, authorize('ORGANIZER', 'ADMIN'), async (req, res, next) => {
  const { eventTitle, duration, topics, speakers, breaks } = req.body;
  await proxyToFlask('/ai/schedule', { eventTitle, duration, topics, speakers, breaks }, res, next);
});

module.exports = router;
