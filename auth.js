const authenticate = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    // For development, you can skip auth by not providing API key
    // For production, make sure to set API_KEY in .env
    if (!process.env.API_KEY) {
        console.log('⚠️  API_KEY not set in .env - authentication disabled');
        return next();
    }
    
    if (!apiKey) {
        return res.status(401).json({ 
            error: 'Authentication required. Please provide API key in x-api-key header.' 
        });
    }
    
    if (apiKey !== process.env.API_KEY) {
        return res.status(403).json({ 
            error: 'Invalid API key. Access denied.' 
        });
    }
    
    next();
};

module.exports = authenticate;