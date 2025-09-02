const express = require('express');
const { Checkout, Table, Organization } = require('../models');
const OrganizationMatcher = require('../middleware/organizationMatcher');
const { Op } = require('sequelize');

const router = express.Router();
const matcher = new OrganizationMatcher();

router.get('/', async (req, res) => {
  try {
    const { status, overdue, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status) where.status = status;
    
    if (overdue === 'true') {
      where[Op.and] = [
        { status: 'active' },
        { expectedReturnTime: { [Op.lt]: new Date() } },
      ];
    }
    
    const checkouts = await Checkout.findAndCountAll({
      where,
      include: [
        { model: Organization, required: false },
        { model: Table, required: false },
      ],
      order: [['checkoutTime', 'DESC']],
      limit: parseInt(limit),
      offset,
    });
    
    res.json({
      checkouts: checkouts.rows,
      totalCount: checkouts.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(checkouts.count / limit),
    });
  } catch (error) {
    console.error('Error fetching checkouts:', error);
    res.status(500).json({ error: 'Failed to fetch checkouts' });
  }
});

router.get('/active', async (req, res) => {
  try {
    console.log('Fetching active checkouts...');
    
    const activeCheckouts = await Checkout.findAll({
      where: { status: 'active' },
      include: [
        { model: Organization, required: false },
        { model: Table, required: false },
      ],
      order: [['checkoutTime', 'DESC']],
    });
    
    console.log(`Found ${activeCheckouts.length} active checkouts`);
    console.log('Sample checkout data:', JSON.stringify(activeCheckouts[0], null, 2));
    
    res.json(activeCheckouts);
  } catch (error) {
    console.error('Error fetching active checkouts:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to fetch active checkouts', details: error.message });
  }
});

router.get('/overdue', async (req, res) => {
  try {
    const overdueCheckouts = await Checkout.findAll({
      where: {
        status: 'active',
        expectedReturnTime: { [Op.lt]: new Date() },
      },
      include: [
        { model: Organization, required: false },
        { model: Table, required: false },
      ],
      order: [['expectedReturnTime', 'ASC']],
    });
    
    res.json(overdueCheckouts);
  } catch (error) {
    console.error('Error fetching overdue checkouts:', error);
    res.status(500).json({ error: 'Failed to fetch overdue checkouts' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [
      totalActive,
      totalOverdue,
      todayCheckouts,
      totalTables,
      availableTables,
    ] = await Promise.all([
      Checkout.count({ where: { status: 'active' } }),
      Checkout.count({
        where: {
          status: 'active',
          expectedReturnTime: { [Op.lt]: new Date() },
        },
      }),
      Checkout.count({
        where: {
          checkoutTime: { [Op.between]: [today, tomorrow] },
        },
      }),
      Table.count(),
      Table.count({ where: { status: 'available' } }),
    ]);
    
    const avgDurationResult = await Checkout.findAll({
      where: {
        checkoutTime: { [Op.between]: [today, tomorrow] },
        actualReturnTime: { [Op.not]: null },
      },
      attributes: [
        [
          require('sequelize').fn(
            'AVG',
            require('sequelize').fn(
              'EXTRACT',
              require('sequelize').literal("EPOCH FROM (actual_return_time - checkout_time)")
            )
          ),
          'avgDuration'
        ],
      ],
    });
    
    const avgDurationSeconds = avgDurationResult[0]?.dataValues?.avgDuration || 0;
    const avgDurationHours = Math.round(avgDurationSeconds / 3600 * 100) / 100;
    
    res.json({
      totalActive,
      totalOverdue,
      todayCheckouts,
      totalTables,
      availableTables,
      checkedOutTables: totalTables - availableTables,
      averageCheckoutDurationHours: avgDurationHours,
    });
  } catch (error) {
    console.error('Error fetching checkout stats:', error);
    res.status(500).json({ error: 'Failed to fetch checkout statistics' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      organizationName,
      organizationId,
      tableId,
      expectedReturnTime,
      notes,
      checkedOutBy,
    } = req.body;
    
    if (!tableId || !expectedReturnTime) {
      return res.status(400).json({ error: 'Table ID and expected return time are required' });
    }
    
    const table = await Table.findByPk(tableId);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    if (table.status !== 'available') {
      return res.status(400).json({ error: 'Table is not available for checkout' });
    }
    
    let organization;
    
    if (organizationId) {
      organization = await Organization.findByPk(organizationId);
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }
    } else if (organizationName) {
      const exactMatch = await matcher.findExactMatch(organizationName);
      if (exactMatch) {
        organization = exactMatch.organization;
      } else {
        organization = await matcher.createNewOrganization(organizationName);
      }
    } else {
      return res.status(400).json({ error: 'Organization ID or name is required' });
    }
    
    if (organization.status === 'banned') {
      return res.status(403).json({ 
        error: 'Organization is banned',
        banReason: organization.banReason,
      });
    }
    
    const activeCheckout = await Checkout.findOne({
      where: {
        organizationId: organization.id,
        status: 'active',
      },
    });
    
    if (activeCheckout) {
      return res.status(400).json({ error: 'Organization already has an active checkout' });
    }
    
    const checkout = await Checkout.create({
      organizationId: organization.id,
      tableId,
      expectedReturnTime,
      notes,
      checkedOutBy,
      status: 'active',
    });
    
    await table.update({ status: 'checked_out' });
    
    const checkoutWithDetails = await Checkout.findByPk(checkout.id, {
      include: [
        { model: Organization },
        { model: Table },
      ],
    });
    
    res.status(201).json(checkoutWithDetails);
  } catch (error) {
    console.error('Error creating checkout:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

router.post('/:id/return', async (req, res) => {
  try {
    const { returnedBy, notes } = req.body;
    
    const checkout = await Checkout.findByPk(req.params.id, {
      include: [{ model: Table }],
    });
    
    if (!checkout) {
      return res.status(404).json({ error: 'Checkout not found' });
    }
    
    if (checkout.status !== 'active') {
      return res.status(400).json({ error: 'Checkout is not active' });
    }
    
    const returnTime = new Date();
    const isOverdue = returnTime > new Date(checkout.expectedReturnTime);
    
    await checkout.update({
      actualReturnTime: returnTime,
      status: isOverdue ? 'overdue' : 'returned',
      returnedBy,
      notes: notes ? `${checkout.notes || ''}\nReturn notes: ${notes}` : checkout.notes,
    });
    
    await checkout.Table.update({ status: 'available' });
    
    const updatedCheckout = await Checkout.findByPk(checkout.id, {
      include: [
        { model: Organization },
        { model: Table },
      ],
    });
    
    res.json(updatedCheckout);
  } catch (error) {
    console.error('Error returning checkout:', error);
    res.status(500).json({ error: 'Failed to return checkout' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const checkout = await Checkout.findByPk(req.params.id, {
      include: [
        { model: Organization },
        { model: Table },
      ],
    });
    
    if (!checkout) {
      return res.status(404).json({ error: 'Checkout not found' });
    }
    
    res.json(checkout);
  } catch (error) {
    console.error('Error fetching checkout:', error);
    res.status(500).json({ error: 'Failed to fetch checkout' });
  }
});

module.exports = router;