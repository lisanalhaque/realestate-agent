const Feedback = require('../models/Feedback');

// @desc    Submit feedback or complaint
// @route   POST /api/feedbacks
// @access  Private (User)
exports.submitFeedback = async (req, res) => {
  try {
    const { type, subject, message } = req.body;

    if (!type || !subject || !message) {
      return res.status(400).json({ message: 'Please provide type, subject, and message' });
    }

    const feedback = await Feedback.create({
      userId: req.user._id,
      type,
      subject,
      message,
      status: 'open'
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    console.error('Submit Feedback Error:', error);
    res.status(500).json({ message: 'Server error while submitting feedback' });
  }
};

// @desc    Get all feedbacks
// @route   GET /api/feedbacks
// @access  Private (Admin)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: feedbacks.length, data: feedbacks });
  } catch (error) {
    console.error('Get All Feedbacks Error:', error);
    res.status(500).json({ message: 'Server error fetching feedbacks' });
  }
};
