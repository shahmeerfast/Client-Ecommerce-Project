const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Admin Login
// @route   POST /api/auth/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin user
    const admin = await User.findOne({ email, role: 'admin' }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Check password
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Create token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Admin Register
// @route   POST /api/auth/admin/register
// @access  Public
exports.adminRegister = async (req, res) => {
  try {
    const { fullName, email, password, adminCode } = req.body;

    // Verify admin registration code
    if (adminCode !== process.env.ADMIN_REGISTRATION_CODE) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin registration code'
      });
    }

    // Check if admin exists
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists'
      });
    }

    // Create admin user
    const admin = await User.create({
      fullName,
      email,
      password,
      role: 'admin'
    });

    // Create token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      data: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        token
      }
    });
  } catch (error) {
    console.error('Admin register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
}; 