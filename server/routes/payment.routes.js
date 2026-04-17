const express = require('express');
const { createPaymentIntent, verifyPayment } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

// broker included so brokers can pay advance on their own negotiations; assertCanPayBid enforces ownership
router.post('/create-intent', protect, authorize('user', 'broker', 'admin'), createPaymentIntent);
router.post('/verify', protect, authorize('user', 'broker', 'admin'), verifyPayment);

module.exports = router;
