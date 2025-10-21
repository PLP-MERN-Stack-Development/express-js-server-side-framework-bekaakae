const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // Check if MongoDB URI is provided
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        // MongoDB connection options
        const options = {
            // useNewUrlParser and useUnifiedTopology are no longer needed in Mongoose 6+
            // but keeping for compatibility if needed
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // Additional recommended options
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 5, // Maintain at least 5 socket connections
            retryWrites: true,
            w: 'majority'
        };

        // Attempt connection
        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log(`👤 Connection State: ${mongoose.STATES[conn.connection.readyState]}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (err) {
        console.error('❌ MongoDB connection failed:');
        console.error('Error:', err.message);
        
        // More detailed error information
        if (err.name === 'MongoServerSelectionError') {
            console.error('🔧 Troubleshooting tips:');
            console.error('1. Check your MongoDB Atlas connection string');
            console.error('2. Verify your IP is whitelisted in Atlas');
            console.error('3. Check your database user credentials');
            console.error('4. Ensure network connectivity');
        }
        
        process.exit(1);
    }
};

module.exports = connectDB;