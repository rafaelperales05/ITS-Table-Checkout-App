// Utility to wrap serverless functions with common functionality
const { initializeDatabase } = require('./database');

const createHandler = (handlerFn) => {
  return async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    try {
      // Initialize database connection
      await initializeDatabase();
      
      // Call the actual handler
      await handlerFn(req, res);
    } catch (error) {
      console.error('Serverless handler error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  };
};

module.exports = { createHandler };