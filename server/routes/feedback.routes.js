const express = require('express');
const { submitFeedback, getAllFeedbacks } = require('../controllers/feedback.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

router.post('/', protect, authorize('user'), submitFeedback);
router.get('/', protect, authorize('admin'), getAllFeedbacks);

module.exports = router;
