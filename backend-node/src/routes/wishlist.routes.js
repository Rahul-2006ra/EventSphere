const express = require('express');
const router = express.Router();
const { getWishlist, toggleWishlist, checkWishlist } = require('../controllers/wishlist.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', getWishlist);
router.get('/:eventId/check', checkWishlist);
router.post('/:eventId', toggleWishlist);

module.exports = router;
