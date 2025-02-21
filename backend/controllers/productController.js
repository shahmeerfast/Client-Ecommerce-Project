const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
}).single('image');

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = asyncHandler(async (req, res) => {
  try {
    console.log('Received product data:', req.body);
    console.log('Received file:', req.file); // Debug log for file

    const { name, description, price, category, stock } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({
        message: 'Please provide all required fields'
      });
    }

    // Create product with image path
    const product = await Product.create({
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
      seller: req.user._id,
      image: req.file ? `uploads/${req.file.filename}` : undefined // Store the relative path
    });

    console.log('Created product:', product);

    res.status(201).json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(400).json({
      message: error.message || 'Failed to create product',
      error: error
    });
  }
});

// @desc    Get user products
// @route   GET /api/products/user
// @access  Private
const getUserProducts = asyncHandler(async (req, res) => {
  try {
    // Ensure we have a valid user ID
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find products where user field matches the authenticated user's ID
    const products = await Product.find({ user: req.user._id });
    
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get user products error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate if id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }

  let product = await Product.findById(id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if the user owns the product
  if (product.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to update this product'
    });
  }

  product = await Product.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate if id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }

  const product = await Product.findById(id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if the user owns the product
  if (product.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to delete this product'
    });
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate if id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product ID'
    });
  }

  const product = await Product.findById(id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Get all products for logged in user
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ seller: req.user._id });
  res.json(products);
});

// @desc    Get pending products
// @route   GET /api/products/pending
// @access  Admin/SubAdmin
const getPendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: 'pending' })
    .populate('user', 'fullName email')
    .sort('-createdAt');

  res.json({
    success: true,
    data: products
  });
});

// @desc    Approve product
// @route   PUT /api/products/:id/approve
// @access  Admin/SubAdmin
const approveProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  if (product.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Product is not in pending status'
    });
  }

  product.status = 'approved';
  product.approvedBy = req.user._id;
  product.approvedAt = Date.now();
  await product.save();

  // Send notification to seller
  // TODO: Implement notification system

  res.json({
    success: true,
    data: product
  });
});

// @desc    Reject product
// @route   PUT /api/products/:id/reject
// @access  Admin/SubAdmin
const rejectProduct = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required'
    });
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  if (product.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Product is not in pending status'
    });
  }

  product.status = 'rejected';
  product.rejectionReason = reason;
  product.approvedBy = req.user._id;
  product.approvedAt = Date.now();
  await product.save();

  // Send notification to seller
  // TODO: Implement notification system

  res.json({
    success: true,
    data: product
  });
});

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if the product belongs to the current user
    if (product.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this product'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product details'
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  getPendingProducts,
  approveProduct,
  rejectProduct
}; 