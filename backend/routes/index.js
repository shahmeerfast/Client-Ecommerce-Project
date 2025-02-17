const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);

module.exports = router; 