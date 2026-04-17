const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const exists = await User.findOne({ email: 'admin@boom.com' });
    if (exists) {
      console.log('Admin already exists: admin@boom.com');
      process.exit(0);
    }

    const admin = new User({
      name: 'Super Admin',
      email: 'admin@boom.com',
      password: 'adminpassword', // Assuming the model does pre-save hashing
      role: 'admin',
      isActive: true,
      isVerified: true
    });
    
    await admin.save();
    console.log('Successfully created Admin account!');
    console.log('Email: admin@boom.com');
    console.log('Password: adminpassword');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  }
};

seedAdmin();
