// POST /api/organizations/validate-checkout - Validate organization for checkout
const { createHandler } = require('../../lib/serverless-handler');
const { Organization, Checkout, Table } = require('../../lib/database');
const { ValidationError } = require('../../lib/errors');

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name } = req.body;

    // Validate input
    if (!name || !name.trim()) {
      throw new ValidationError('Organization name is required');
    }

    const orgName = name.trim();

    // Find organization by name (exact match first, then fuzzy)
    let organization = await Organization.findOne({
      where: { officialName: orgName }
    });

    // Check if organization is banned
    if (organization && organization.status === 'banned') {
      return res.status(200).json({
        allowed: false,
        message: `Organization is banned: ${organization.banReason || 'Policy violation'}`,
        bannedOrganization: organization
      });
    }

    // Check for existing active checkout
    let activeCheckout = null;
    if (organization) {
      activeCheckout = await Checkout.findOne({
        where: { 
          organizationId: organization.id, 
          status: 'active' 
        },
        include: [{ model: Table, attributes: ['tableNumber'] }]
      });

      if (activeCheckout) {
        return res.status(200).json({
          allowed: false,
          message: `Organization already has an active checkout`,
          activeCheckout,
          confirmedOrganization: organization
        });
      }
    }

    // If organization exists and is not banned/has no active checkout
    if (organization) {
      return res.status(200).json({
        allowed: true,
        message: 'Organization validated successfully',
        confirmedOrganization: organization
      });
    }

    // Organization doesn't exist - allow creation of new organization
    // In a real app, you might want to search for similar names here
    return res.status(200).json({
      allowed: true,
      message: 'New organization will be created',
      requireConfirmation: true
    });

  } catch (error) {
    throw error;
  }
};

module.exports = createHandler(handler, 'organizations-validate-checkout');