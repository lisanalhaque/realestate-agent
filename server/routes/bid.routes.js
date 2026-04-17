const express = require('express');
const { createBid, getBidsForBroker, getUserBids, updateBidStatus, getBiddersForBroker, getBidsPipeline, updateBidPipeline, getBrokerStats } = require('../controllers/bid.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

router.post('/', protect, authorize('user', 'broker', 'admin'), createBid);
router.get('/broker', protect, authorize('broker', 'admin'), getBidsForBroker);
router.get('/broker/bidders', protect, authorize('broker', 'admin'), getBiddersForBroker);
router.get('/broker/pipeline', protect, authorize('broker', 'admin'), getBidsPipeline);
router.get('/broker/stats', protect, authorize('broker', 'admin'), getBrokerStats);
router.get('/user', protect, authorize('user', 'broker', 'admin'), getUserBids);
router.put('/:bidId/status', protect, authorize('broker', 'admin'), updateBidStatus);
router.put('/:bidId/pipeline', protect, authorize('broker', 'admin'), updateBidPipeline);

module.exports = router;
