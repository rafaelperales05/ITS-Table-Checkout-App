// GET /api/health - Health check endpoint (no database required)
const { createHandler } = require('../lib/serverless-handler');

const handler = async (req, res) => {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return health status
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ITS Table Checkout API'
  });
};

module.exports = createHandler(handler, 'health-check');