const express = require('express');
const router = express.Router();
const { adminLogin, adminRegister } = require('../controllers/adminAuthController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public admin auth routes
router.post('/login', adminLogin);
router.post('/register', adminRegister);

// Protected admin routes
router.use(protect);
router.use(authorize(['admin']));

// Add more protected admin routes here
// router.get('/dashboard-stats', getDashboardStats);
// router.get('/all-users', getAllUsers);

module.exports = router; 