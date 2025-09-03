// GET /api/tables - Get all tables with optional filtering
const { createHandler } = require('../lib/serverless-handler');
const { Table } = require('../lib/database');
const { ValidationError } = require('../lib/errors');

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse query parameters
    const { available, status, page, limit } = req.query;
    
    // Validate mutually exclusive filters
    if (available && status) {
      throw new ValidationError('Cannot use both "available" and "status" filters simultaneously. Use one or the other.');
    }
    
    // Build where clause
    const where = {};
    
    if (available !== undefined) {
      if (available === 'true') {
        where.status = 'available';
      } else if (available === 'false') {
        // Show non-available tables (checked_out, maintenance)
        where.status = { [require('../lib/database').sequelize.Sequelize.Op.ne]: 'available' };
      } else {
        throw new ValidationError('Parameter "available" must be "true" or "false"');
      }
    } else if (status) {
      // Validate status values
      const validStatuses = ['available', 'checked_out', 'maintenance'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`);
      }
      where.status = status;
    }

    // Parse and validate pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    
    if (pageNum < 1) {
      throw new ValidationError('Page must be a positive integer');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }
    
    const offset = (pageNum - 1) * limitNum;

    // Query tables
    const { count, rows } = await Table.findAndCountAll({
      where,
      order: [['tableNumber', 'ASC']],
      limit: limitNum,
      offset
    });

    // Return paginated results
    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      itemsPerPage: limitNum,
      data: rows
    });

  } catch (error) {
    // ValidationError will automatically return 400 status via our error handler
    throw error;
  }
};

module.exports = createHandler(handler, 'tables-list');