// POST /api/organizations/[id]/unban - Unban an organization
const { createHandler } = require('../../../lib/serverless-handler');
const { Organization, sequelize } = require('../../../lib/database');
const { ValidationError, NotFoundError, ConflictError } = require('../../../lib/errors');

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { notes } = req.body;

    // Validate organization ID
    if (!id) {
      throw new ValidationError('Organization ID is required');
    }

    const orgId = parseInt(id, 10);
    if (isNaN(orgId)) {
      throw new ValidationError('Invalid organization ID');
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

      // Check if organization is banned
      if (organization.status !== 'banned') {
        throw new ConflictError(`Organization "${organization.officialName}" is not currently banned (status: ${organization.status})`);
      }

      // Unban the organization
      await organization.update({
        status: 'active',
        banReason: notes ? `[UNBANNED] ${notes.trim()}\n[PREVIOUS BAN] ${organization.banReason || 'No reason provided'}` : null,
        banDate: null // Clear ban date
      }, { transaction });

      return organization;
    });

    res.status(200).json({
      message: `Organization "${result.officialName}" has been unbanned`,
      organization: result
    });

  } catch (error) {
    throw error;
  }
};

module.exports = createHandler(handler, 'organizations-unban');