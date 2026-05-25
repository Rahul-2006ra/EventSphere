const express = require('express');
const router = express.Router();
const { getProfile, getPublicProfile, getUserStats } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/profile', authenticate, getProfile);
router.get('/stats', authenticate, getUserStats);
router.get('/:id/public', getPublicProfile);

module.exports = router;
