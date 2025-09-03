// GET /api/checkouts/overdue - Get all overdue checkouts with pagination
const { createHandler } = require('../../lib/serverless-handler');
const { Organization, Table, Checkout, sequelize } = require('../../lib/database');

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new Date();
    
    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const offset = (page - 1) * limit;

    const { count, rows } = await Checkout.findAndCountAll({
      where: { 
        status: 'active',
        expectedReturnTime: { [sequelize.Sequelize.Op.lt]: now }
      },
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
      order: [['expectedReturnTime', 'ASC']], // Most overdue first
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
    console.error('Overdue checkouts endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch overdue checkouts'
    });
  }
};

module.exports = createHandler(handler, 'checkouts-overdue');