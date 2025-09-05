// GET /api/checkouts/active - Get all active checkouts with pagination
const { createHandler } = require('../../lib/serverless-handler');
const { Organization, Table, Checkout } = require('../../lib/database');

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100); // Cap at 100
    const offset = (page - 1) * limit;

    const { count, rows } = await Checkout.findAndCountAll({
      where: { status: 'active' },
      include: [
        {
          model: Organization,
          attributes: ['id', 'officialName']
        },
        {
          model: Table,
          attributes: ['id', 'tableNumber', 'location']
        }
      ],
      order: [['checkoutTime', 'DESC']],
      limit,
      offset
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      itemsPerPage: limit,
      data: rows
    });
  } catch (error) {
    console.error('Active checkouts endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active checkouts'
    });
  }
};

module.exports = createHandler(handler, 'checkouts-active');