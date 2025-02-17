const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createProduct,
  getUserProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const upload = require('../middleware/upload');

// Protect all routes
router.use(protect);

// Routes
router.route('/')
  .post(upload.single('image'), createProduct);

router.route('/user')
  .get(getUserProducts);

router.route('/:id')
  .get(getProductById)
  .put(upload.single('image'), updateProduct)
  .delete(deleteProduct);

module.exports = router; 