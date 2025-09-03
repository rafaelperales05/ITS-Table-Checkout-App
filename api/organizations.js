// GET /api/organizations - Get all organizations (minimal implementation)
const { createHandler } = require('../lib/serverless-handler');
const { Organization } = require('../lib/database');

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse pagination parameters
    const { page, limit } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
    const offset = (pageNum - 1) * limitNum;

    // Query organizations
    const { count, rows } = await Organization.findAndCountAll({
      order: [['officialName', 'ASC']],
      limit: limitNum,
      offset
    });

    // Return paginated results
    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      itemsPerPage: limitNum,
      data: rows
    });

  } catch (error) {
    console.error('Organizations endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch organizations'
    });
  }
};

module.exports = createHandler(handler, 'organizations-list');