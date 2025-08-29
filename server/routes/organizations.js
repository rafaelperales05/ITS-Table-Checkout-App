const express = require('express');
const { Organization, Checkout } = require('../models');
const OrganizationMatcher = require('../middleware/organizationMatcher');
const { Op } = require('sequelize');

const router = express.Router();
const matcher = new OrganizationMatcher();

router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    
    if (search) {
      where[Op.or] = [
        { officialName: { [Op.iLike]: `%${search}%` } },
        { aliases: { [Op.overlap]: [search] } },
      ];
    }
    
    const offset = (page - 1) * limit;
    
    const organizations = await Organization.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['officialName', 'ASC']],
    });
    
    res.json({
      organizations: organizations.rows,
      totalCount: organizations.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(organizations.count / limit),
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const organization = await Organization.findByPk(req.params.id, {
      include: [
        {
          model: Checkout,
          include: [{ model: require('../models').Table }],
          order: [['checkoutTime', 'DESC']],
        },
      ],
    });
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

router.post('/search-matches', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }
    
    const matches = await matcher.findSimilarOrganizations(name);
    res.json({ matches });
  } catch (error) {
    console.error('Error searching for matches:', error);
    res.status(500).json({ error: 'Failed to search for matches' });
  }
});

router.post('/validate-checkout', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }
    
    const validation = await matcher.validateCheckoutAttempt(name);
    res.json(validation);
  } catch (error) {
    console.error('Error validating checkout:', error);
    res.status(500).json({ error: 'Failed to validate checkout' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { officialName, aliases = [], category = 'Student Organization' } = req.body;
    
    if (!officialName) {
      return res.status(400).json({ error: 'Official name is required' });
    }
    
    const organization = await Organization.create({
      officialName,
      aliases,
      category,
      status: 'active',
    });
    
    res.status(201).json(organization);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Organization with this name already exists' });
    }
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { officialName, aliases, category, status } = req.body;
    
    const organization = await Organization.findByPk(req.params.id);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    await organization.update({
      ...(officialName && { officialName }),
      ...(aliases && { aliases }),
      ...(category && { category }),
      ...(status && { status }),
    });
    
    res.json(organization);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

router.post('/:id/ban', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const organization = await Organization.findByPk(req.params.id);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    await organization.update({
      status: 'banned',
      banReason: reason,
      banDate: new Date(),
    });
    
    res.json(organization);
  } catch (error) {
    console.error('Error banning organization:', error);
    res.status(500).json({ error: 'Failed to ban organization' });
  }
});

router.post('/:id/unban', async (req, res) => {
  try {
    const organization = await Organization.findByPk(req.params.id);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    await organization.update({
      status: 'active',
      banReason: null,
      banDate: null,
    });
    
    res.json(organization);
  } catch (error) {
    console.error('Error unbanning organization:', error);
    res.status(500).json({ error: 'Failed to unban organization' });
  }
});

// Removed scraping endpoint - using CSV data for POC

module.exports = router;