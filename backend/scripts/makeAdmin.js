const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const makeAdmin = async (email) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`User ${email} is now an admin`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Usage: node makeAdmin.js user@example.com
const email = process.argv[2];
if (!email) {
  console.log('Please provide an email address');
  process.exit(1);
}

makeAdmin(email); 