const User = require('../models/User');

exports.getBrokers = async (req, res) => {
  try {
    // Both 'agent' and 'broker' for backwards compatibility
    const brokers = await User.find({ role: { $in: ['broker', 'agent'] } }).select('-password');
    res.json(brokers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBrokerStatus = async (req, res) => {
  try {
    const broker = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
    res.json(broker);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBroker = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Broker deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
