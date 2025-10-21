// server.js - Complete Product API for Week 2 assignment

// Import required modules
const express = require('express');
require('dotenv').config();
const connectDB = require('./db');

// Import middleware
const logger = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const productRoutes = require('./routes/productRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware setup
app.use(express.json()); // Built-in Express JSON parser

// Custom logger middleware
app.use(logger);

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to the Product API!',
        endpoints: {
            getAllProducts: 'GET /api/products',
            getProduct: 'GET /api/products/:id',
            createProduct: 'POST /api/products',
            updateProduct: 'PUT /api/products/:id',
            deleteProduct: 'DELETE /api/products/:id',
            searchProducts: 'GET /api/products/search/name?q=query',
            getStats: 'GET /api/products/stats/summary'
        },
        note: 'API key required for POST, PUT, DELETE operations in x-api-key header'
    });
});

// Product routes
app.use('/api/products', productRoutes);

// 404 handler for undefined routes - FIXED: Use a proper path pattern
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Route not found',
        message: `The route ${req.method} ${req.originalUrl} does not exist on this server`,
        availableRoutes: [
            'GET /',
            'GET /api/products',
            'GET /api/products/:id',
            'POST /api/products',
            'PUT /api/products/:id', 
            'DELETE /api/products/:id',
            'GET /api/products/search/name?q=query',
            'GET /api/products/stats/summary'
        ]
    });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export the app for testing purposes
module.exports = app;