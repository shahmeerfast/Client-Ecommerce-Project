const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Define protect middleware
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    console.log('Token:', token); // Debug log

    if (!token) {
      console.log('No token found'); // Debug log
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded); // Debug log

      // Get user from token using the correct _id field
      const user = await User.findOne({ _id: decoded.id }).select('-password');
      console.log('Looking for user with ID:', decoded.id);
      console.log('Found user:', user);

      if (!user) {
        console.log('No user found for token'); // Debug log
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Not authorized',
      error: error.message
    });
  }
};

// Define authorize middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'No role specified'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Export both middlewares
module.exports = { protect, authorize };
