const express = require('express');
const router = express.Router();
const { register, login, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.put('/profile', protect, updateProfile);

module.exports = router;
