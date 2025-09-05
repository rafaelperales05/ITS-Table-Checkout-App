// GET /api/tables/[id] - Get a single table by ID
const { createHandler } = require('../../lib/serverless-handler');
const { Table } = require('../../lib/database');
const { ValidationError, NotFoundError } = require('../../lib/errors');

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Validate table ID
    if (!id) {
      throw new ValidationError('Table ID is required');
    }

    const tableId = parseInt(id, 10);
    if (isNaN(tableId)) {
      throw new ValidationError('Invalid table ID');
    }

    // Find table by ID
    const table = await Table.findByPk(tableId);

    if (!table) {
      throw new NotFoundError('Table not found');
    }

    res.status(200).json({
      table
    });

  } catch (error) {
    throw error;
  }
};

module.exports = createHandler(handler, 'tables-get-by-id');