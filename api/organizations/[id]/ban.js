// POST /api/organizations/[id]/ban - Ban an organization
const { createHandler } = require('../../../lib/serverless-handler');
const { Organization, Checkout, Table, sequelize } = require('../../../lib/database');
const { ValidationError, NotFoundError, ConflictError } = require('../../../lib/errors');

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { reason, returnActiveTables } = req.body;

    // Validate organization ID
    if (!id) {
      throw new ValidationError('Organization ID is required');
    }

    const orgId = parseInt(id, 10);
    if (isNaN(orgId)) {
      throw new ValidationError('Invalid organization ID');
    }

    // Validate ban reason
    if (!reason || !reason.trim()) {
      throw new ValidationError('Ban reason is required');
    }

    if (reason.trim().length > 500) {
      throw new ValidationError('Ban reason must be less than 500 characters');
    }

    // Start transaction
    const result = await sequelize.transaction(async (transaction) => {
      // Find and lock the organization
      const organization = await Organization.findByPk(orgId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!organization) {
        throw new NotFoundError('Organization not found');
      }

      // Check if already banned
      if (organization.status === 'banned') {
        throw new ConflictError(`Organization "${organization.officialName}" is already banned`);
      }

      // Find active checkouts for this organization
      const activeCheckouts = await Checkout.findAll({
        where: { 
          organizationId: organization.id, 
          status: 'active' 
        },
        transaction
      });

      // If we have active checkouts, get the table information separately to avoid JOIN issues
      if (activeCheckouts.length > 0) {
        for (const checkout of activeCheckouts) {
          const table = await Table.findByPk(checkout.tableId, { transaction });
          checkout.Table = table; // Add table info to checkout object
        }
      }

      // Handle active checkouts based on returnActiveTables flag
      if (activeCheckouts.length > 0) {
        if (returnActiveTables) {
          // Return all active tables
          const now = new Date();
          
          for (const checkout of activeCheckouts) {
            await checkout.update({
              status: 'returned',
              actualReturnTime: now,
              notes: `${checkout.notes || ''}\n[Auto-returned] Organization banned: ${reason.trim()}`.trim(),
              returnedBy: 'SYSTEM - Ban Action'
            }, { transaction });

            // Set table back to available
            await checkout.Table.update({
              status: 'available'
            }, { transaction });
          }
        } else {
          // Just report the active checkouts without returning them
          const tableNumbers = activeCheckouts.map(c => c.Table.tableNumber).join(', ');
          throw new ConflictError(
            `Organization has ${activeCheckouts.length} active checkout(s) for table(s): ${tableNumbers}. ` +
            `Use 'returnActiveTables: true' to automatically return them when banning.`
          );
        }
      }

      // Ban the organization
      await organization.update({
        status: 'banned',
        banReason: reason.trim(),
        banDate: new Date()
      }, { transaction });

      return {
        organization,
        returnedCheckouts: activeCheckouts.length
      };
    });

    res.status(200).json({
      message: `Organization "${result.organization.officialName}" has been banned`,
      organization: result.organization,
      returnedCheckouts: result.returnedCheckouts
    });

  } catch (error) {
    throw error;
  }
};

module.exports = createHandler(handler, 'organizations-ban');