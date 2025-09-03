// GET /api/checkouts/stats - Get checkout statistics
const { createHandler } = require('../../lib/serverless-handler');
const { Organization, Table, Checkout, sequelize } = require('../../lib/database');

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Use Promise.all for parallel queries
    const [
      totalActiveResult,
      totalOverdueResult,
      todayCheckoutsResult,
      totalTablesResult,
      availableTablesResult,
      checkedOutTablesResult,
      avgDurationResult
    ] = await Promise.all([
      // Total active checkouts
      Checkout.count({ where: { status: 'active' } }),
      
      // Total overdue checkouts
      Checkout.count({ 
        where: { 
          status: 'active',
          expectedReturnTime: { [sequelize.Sequelize.Op.lt]: now }
        } 
      }),
      
      // Today's checkouts
      Checkout.count({ 
        where: { 
          checkoutTime: { [sequelize.Sequelize.Op.gte]: todayStart }
        } 
      }),
      
      // Total tables
      Table.count(),
      
      // Available tables
      Table.count({ where: { status: 'available' } }),
      
      // Checked out tables
      Table.count({ where: { status: 'checked_out' } }),
      
      // Average checkout duration (in hours) for completed checkouts
      Checkout.findAll({
        where: { 
          status: 'returned',
          actualReturnTime: { [sequelize.Sequelize.Op.ne]: null }
        },
        attributes: [
          [sequelize.fn('AVG', 
            sequelize.literal('EXTRACT(epoch FROM (actual_return_time - checkout_time)) / 3600')
          ), 'avgHours']
        ],
        raw: true
      })
    ]);

    const averageCheckoutDurationHours = avgDurationResult[0]?.avgHours 
      ? parseFloat(avgDurationResult[0].avgHours).toFixed(1)
      : 0;

    const stats = {
      totalActive: totalActiveResult,
      totalOverdue: totalOverdueResult,
      todayCheckouts: todayCheckoutsResult,
      totalTables: totalTablesResult,
      availableTables: availableTablesResult,
      checkedOutTables: checkedOutTablesResult,
      averageCheckoutDurationHours: parseFloat(averageCheckoutDurationHours)
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Stats endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
};

module.exports = createHandler(handler);