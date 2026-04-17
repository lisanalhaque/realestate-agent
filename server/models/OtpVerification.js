const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true }, // Not unique globally here because they might try again if it fails
  password: { type: String, required: true },
  role: { type: String },
  phone: { type: String },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 120 } // 2 minutes stringently as requested
});

module.exports = mongoose.model('OtpVerification', otpSchema);
