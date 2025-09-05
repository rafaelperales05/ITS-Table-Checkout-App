// POST /api/checkouts/[id]/return - Return a checkout
const { createHandler } = require('../../../lib/serverless-handler');
const { Organization, Table, Checkout, sequelize } = require('../../../lib/database');
const { ValidationError, NotFoundError, ConflictError } = require('../../../lib/errors');

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { returnedBy, notes } = req.body;

    // Validate checkout ID
    if (!id) {
      throw new ValidationError('Checkout ID is required');
    }

    const checkoutId = parseInt(id, 10);
    if (isNaN(checkoutId)) {
      throw new ValidationError('Invalid checkout ID');
    }

    // Start transaction with SELECT FOR UPDATE to prevent race conditions
    const result = await sequelize.transaction(async (transaction) => {
      // Find and lock the checkout (without includes to avoid JOIN with FOR UPDATE)
      const checkout = await Checkout.findByPk(checkoutId, {
        lock: transaction.LOCK.UPDATE, // SELECT ... FOR UPDATE
        transaction
      });

      if (!checkout) {
        throw new NotFoundError('Checkout not found');
      }

      // Now get the related data separately (after we have the lock)
      const [organization, table] = await Promise.all([
        Organization.findByPk(checkout.organizationId, {
          attributes: ['id', 'officialName'],
          transaction
        }),
        Table.findByPk(checkout.tableId, {
          attributes: ['id', 'tableNumber', 'location'],
          transaction
        })
      ]);

      // Add the related data to the checkout object for convenience
      checkout.Organization = organization;
      checkout.Table = table;

      // Check if already returned
      if (checkout.status === 'returned') {
        throw new ConflictError('Checkout has already been returned');
      }

      // Check if checkout is active
      if (checkout.status !== 'active') {
        throw new ConflictError(`Cannot return checkout with status: ${checkout.status}`);
      }

      const now = new Date();
      
      // Update checkout status and return time
      await checkout.update({
        status: 'returned',
        actualReturnTime: now,
        returnedBy: returnedBy?.trim() || null,
        notes: notes ? `${checkout.notes || ''}\n[Return] ${notes.trim()}`.trim() : checkout.notes
      }, { transaction });

      // Update table status back to available
      await table.update({
        status: 'available'
      }, { transaction });

      // Return updated checkout with related data
      return await Checkout.findByPk(checkoutId, {
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

    res.status(200).json({
      message: 'Checkout returned successfully',
      checkout: result
    });

  } catch (error) {
    // Handle specific database constraint errors
    if (error.name === 'SequelizeTimeoutError') {
      throw new ConflictError('Return request timed out. Please try again.');
    }
    
    // Custom errors will automatically return appropriate status codes via our error handler
    throw error;
  }
};

module.exports = createHandler(handler, 'checkouts-return');