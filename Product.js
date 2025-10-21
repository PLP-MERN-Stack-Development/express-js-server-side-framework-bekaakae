const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: { 
        type: String, 
        required: [true, 'Product description is required'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    price: { 
        type: Number, 
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },
    category: { 
        type: String, 
        required: [true, 'Product category is required'],
        trim: true
    },
    inStock: { 
        type: Boolean, 
        default: true 
    }
}, { 
    timestamps: true 
});

// Create text index for search functionality
ProductSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;