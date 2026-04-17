const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already registered.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await OtpVerification.deleteMany({ email });

    await OtpVerification.create({ 
      name, email, password, role, phone, otp 
    });

    const sendEmail = require('../utils/sendEmail');
    try {
      await sendEmail({
        to: email,
        subject: 'Real Estate App - Verify your OTP',
        text: `Your OTP for registration is ${otp}. It is mathematically valid for exactly 2 minutes.`,
      });
      res.status(201).json({ message: 'Payload cached. Please verify OTP sent to email.' });
    } catch (err) {
      console.error("Email send failed:", err);
      res.status(500).json({ message: 'Failed to send OTP email' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const pendingUser = await OtpVerification.findOne({ email, otp });
    
    if (!pendingUser) {
      return res.status(400).json({ message: 'Invalid or Expired OTP' });
    }

    const isActive = pendingUser.role === 'broker' ? false : true;

    const user = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      role: pendingUser.role,
      phone: pendingUser.phone,
      isActive: isActive
    });

    await OtpVerification.deleteMany({ email });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("OTP_CRASH_DUMP:", error);
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 mins as requested

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const sendEmail = require('../utils/sendEmail');
    try {
      await sendEmail({
        to: user.email,
        subject: 'Real Estate App - Password Reset OTP',
        text: `Your OTP for password reset is ${otp}. It is valid for exactly 2 minutes.`,
      });
      res.json({ message: 'Password reset OTP sent to email.' });
    } catch (err) {
      console.error("Email send failed:", err);
      res.status(500).json({ message: 'Failed to send OTP email.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.otpExpires < new Date()) return res.status(400).json({ message: 'OTP expired' });

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been successfully reset.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getMe, verifyOTP, forgotPassword, resetPassword };
