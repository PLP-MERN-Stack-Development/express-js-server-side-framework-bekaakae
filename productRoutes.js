const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Import middleware
const { validateProduct } = require('../middleware/validation');
const authenticate = require('../middleware/auth');

// Helper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Get all products with filtering, pagination, and search
router.get('/', asyncHandler(async (req, res) => {
    const { 
        category, 
        inStock, 
        search, 
        page = 1, 
        limit = 10,
        minPrice,
        maxPrice
    } = req.query;

    // Build filter object
    let filter = {};
    
    if (category) {
        filter.category = new RegExp(category, 'i');
    }
    
    if (inStock !== undefined) {
        filter.inStock = inStock === 'true';
    }
    
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Search functionality
    if (search) {
        filter.$or = [
            { name: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') }
        ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    // Get total count for pagination info
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
        products,
        pagination: {
            currentPage: pageNum,
            totalPages,
            totalProducts: total,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        }
    });
}));

// Get product by ID
router.get('/:id', asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
}));

// Create new product (protected route)
router.post('/', authenticate, validateProduct, asyncHandler(async (req, res) => {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
}));

// Update product (protected route)
router.put('/:id', authenticate, validateProduct, asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );
    
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
}));

// Delete product (protected route)
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ 
        message: 'Product deleted successfully',
        deletedProduct: product 
    });
}));

// Search products by name
router.get('/search/name', asyncHandler(async (req, res) => {
    const { q } = req.query;
    
    if (!q) {
        return res.status(400).json({ error: 'Search query parameter "q" is required' });
    }

    const products = await Product.find({
        name: new RegExp(q, 'i')
    }).limit(20);

    res.json(products);
}));

// Get product statistics
router.get('/stats/summary', asyncHandler(async (req, res) => {
    const stats = await Product.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
                inStockCount: {
                    $sum: { $cond: ['$inStock', 1, 0] }
                }
            }
        },
        {
            $project: {
                category: '$_id',
                count: 1,
                avgPrice: { $round: ['$avgPrice', 2] },
                minPrice: 1,
                maxPrice: 1,
                inStockCount: 1,
                outOfStockCount: { $subtract: ['$count', '$inStockCount'] }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    const totalStats = await Product.aggregate([
        {
            $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                totalInStock: { $sum: { $cond: ['$inStock', 1, 0] } },
                avgPriceAll: { $avg: '$price' }
            }
        }
    ]);

    res.json({
        summary: totalStats[0] || { totalProducts: 0, totalInStock: 0, avgPriceAll: 0 },
        byCategory: stats
    });
}));

module.exports = router;