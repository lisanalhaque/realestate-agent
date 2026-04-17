const express = require('express');
const { getBrokers, getUsers, updateBrokerStatus, deleteBroker } = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.get('/brokers', getBrokers);
router.put('/brokers/:id/status', updateBrokerStatus);
router.delete('/brokers/:id', deleteBroker);

module.exports = router;
