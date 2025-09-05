// POST /api/checkouts - Create a new checkout
const { createHandler } = require('../lib/serverless-handler');
const { Organization, Table, Checkout, sequelize } = require('../lib/database');
const { ValidationError, NotFoundError, ConflictError } = require('../lib/errors');

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { organizationName, organizationId, tableId, expectedReturnTime, notes, checkedOutBy } = req.body;

    // Validate required fields
    if (!tableId) {
      throw new ValidationError('Table ID is required');
    }

    if (!organizationName && !organizationId) {
      throw new ValidationError('Organization name or ID is required');
    }

    if (!expectedReturnTime) {
      throw new ValidationError('Expected return time is required');
    }

    // Validate expected return time is in the future
    const expectedReturn = new Date(expectedReturnTime);
    if (expectedReturn <= new Date()) {
      throw new ValidationError('Expected return time must be in the future');
    }

    // Handle organization - find existing or create new (outside transaction for efficiency)
    let organization;
    
    if (organizationId) {
      // Use existing organization
      organization = await Organization.findByPk(organizationId);
      if (!organization) {
        throw new NotFoundError('Organization not found');
      }
    } else {
      // Find or create organization by name
      organization = await Organization.findOne({
        where: { officialName: organizationName.trim() }
      });

      if (!organization) {
        // Create new organization
        organization = await Organization.create({
          officialName: organizationName.trim(),
          category: 'Student Organization', // Default category
          status: 'active'
        });
      }
    }

    // Check if organization is banned
    if (organization.status === 'banned') {
      throw new ConflictError(`Organization "${organization.officialName}" is currently banned: ${organization.banReason || 'Policy violation'}`);
    }

    // Check if organization already has an active checkout
    const existingCheckout = await Checkout.findOne({
      where: { 
        organizationId: organization.id, 
        status: 'active' 
      },
      include: [{ model: Table, attributes: ['tableNumber'] }]
    });

    if (existingCheckout) {
      throw new ConflictError(`Organization "${organization.officialName}" already has an active checkout (Table ${existingCheckout.Table.tableNumber})`);
    }

    // Start transaction with SELECT FOR UPDATE to prevent race conditions
    const result = await sequelize.transaction(async (transaction) => {
      // Lock the table row to prevent concurrent modifications
      const table = await Table.findByPk(tableId, {
        lock: transaction.LOCK.UPDATE, // SELECT ... FOR UPDATE
        transaction
      });

      if (!table) {
        throw new NotFoundError('Table not found');
      }

      // Now that we have the lock, check availability again
      if (table.status !== 'available') {
        throw new ConflictError(`Table ${table.tableNumber} is not available (current status: ${table.status})`);
      }

      // Create checkout
      const checkout = await Checkout.create({
        organizationId: organization.id,
        tableId: table.id,
        expectedReturnTime: expectedReturn,
        notes: notes?.trim() || null,
        checkedOutBy: checkedOutBy?.trim() || null,
        status: 'active'
      }, { transaction });

      // Update table status to checked_out
      await table.update({ 
        status: 'checked_out' 
      }, { transaction });

      // Return checkout with related data
      return await Checkout.findByPk(checkout.id, {
        include: [
          {
            model: Organization,
            attributes: ['id', 'officialName', 'category']
          },
          {
            model: Table,
            attributes: ['id', 'tableNumber', 'location', 'capacity']
          }
        ],
        transaction
      });
    });

    res.status(201).json({
      message: 'Checkout created successfully',
      checkout: result
    });

  } catch (error) {
    // Handle specific database constraint errors
    if (error.name === 'SequelizeTimeoutError') {
      throw new ConflictError('Table checkout request timed out. Please try again.');
    }
    
    // Custom errors will automatically return appropriate status codes via our error handler
    throw error;
  }
};

module.exports = createHandler(handler, 'checkouts-create');