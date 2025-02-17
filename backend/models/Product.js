const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Health & Beauty', 'Other']
  },
  condition: {
    type: String,
    required: [true, 'Please specify product condition'],
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
  },
  image: {
    type: String,
    required: [true, 'Please add an image']
  },
  stock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    min: [0, 'Stock cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      if (ret.image && !ret.image.startsWith('http')) {
        ret.image = `/uploads/products/${ret.image.split('/').pop()}`;
      }
      return ret;
    }
  },
  toObject: { virtuals: true, getters: true }
});

// Virtual for full image URL
productSchema.virtual('imageUrl').get(function() {
  if (this.image) {
    if (this.image.startsWith('http')) {
      return this.image;
    }
    return `http://localhost:5000${this.image}`;
  }
  return 'https://via.placeholder.com/200';
});

module.exports = mongoose.model('Product', productSchema); 