const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

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

// @desc    Create new product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      const { name, description, price, category, condition, stock } = req.body;
      
      const product = await Product.create({
        name,
        description,
        price: Number(price),
        category,
        condition,
        stock: Number(stock),
        image: req.file ? `/uploads/products/${req.file.filename}` : undefined,
        user: req.user._id,
        status: 'pending'
      });

      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Create product error:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: Object.values(error.errors).map(err => err.message).join(', ')
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error creating product'
      });
    }
  });
};

// @desc    Get user products
// @route   GET /api/products/user
// @access  Private
exports.getUserProducts = async (req, res) => {
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
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Update product error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating product'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
};

// @desc    Get all products
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id });
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get pending products
// @route   GET /api/products/pending
// @access  Admin/SubAdmin
exports.getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'pending' })
      .populate('user', 'fullName email')
      .sort('-createdAt');

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get pending products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Approve product
// @route   PUT /api/products/:id/approve
// @access  Admin/SubAdmin
exports.approveProduct = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Approve product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Reject product
// @route   PUT /api/products/:id/reject
// @access  Admin/SubAdmin
exports.rejectProduct = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Reject product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

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