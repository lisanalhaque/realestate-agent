const express = require('express');
const { getCommissions, getCommissionSummary, updateCommissionStatus } = require('../controllers/commission.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/summary', protect, getCommissionSummary);
router.get('/', protect, getCommissions);
router.put('/:id/status', protect, authorize('admin'), updateCommissionStatus);

module.exports = router;
