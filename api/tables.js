// /api/tables - CRUD operations for tables
const { createHandler } = require('../lib/serverless-handler');
const { Table, Checkout, sequelize } = require('../lib/database');
const { ValidationError, NotFoundError, ConflictError } = require('../lib/errors');

const handler = async (req, res) => {
  switch (req.method) {
    case 'GET':
      return await handleGet(req, res);
    case 'POST':
      return await handlePost(req, res);
    case 'PUT':
      return await handlePut(req, res);
    case 'DELETE':
      return await handleDelete(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};

// GET /api/tables - Get all tables with optional filtering
const handleGet = async (req, res) => {

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

// POST /api/tables - Create a new table
const handlePost = async (req, res) => {
  try {
    const { tableNumber, location, capacity, notes, status } = req.body;

    // Validate required fields
    if (!tableNumber) {
      throw new ValidationError('Table number is required');
    }

    // Validate status
    const validStatuses = ['available', 'checked_out', 'maintenance'];
    if (status && !validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate capacity
    if (capacity !== undefined) {
      const capacityNum = parseInt(capacity, 10);
      if (isNaN(capacityNum) || capacityNum < 1 || capacityNum > 50) {
        throw new ValidationError('Capacity must be a number between 1 and 50');
      }
    }

    // Check if table number already exists
    const existingTable = await Table.findOne({
      where: { tableNumber: tableNumber.trim() }
    });

    if (existingTable) {
      throw new ConflictError(`Table number "${tableNumber}" already exists`);
    }

    // Create table
    const table = await Table.create({
      tableNumber: tableNumber.trim(),
      location: location?.trim() || null,
      capacity: capacity ? parseInt(capacity, 10) : null,
      notes: notes?.trim() || null,
      status: status || 'available'
    });

    res.status(201).json({
      message: 'Table created successfully',
      table
    });

  } catch (error) {
    throw error;
  }
};

// PUT /api/tables - Update a table (requires ID in query string)
const handlePut = async (req, res) => {
  try {
    const { id } = req.query;
    const { tableNumber, location, capacity, notes, status } = req.body;

    if (!id) {
      throw new ValidationError('Table ID is required in query parameters');
    }

    const tableId = parseInt(id, 10);
    if (isNaN(tableId)) {
      throw new ValidationError('Invalid table ID');
    }

    // Validate status
    const validStatuses = ['available', 'checked_out', 'maintenance'];
    if (status && !validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate capacity
    if (capacity !== undefined) {
      const capacityNum = parseInt(capacity, 10);
      if (isNaN(capacityNum) || capacityNum < 1 || capacityNum > 50) {
        throw new ValidationError('Capacity must be a number between 1 and 50');
      }
    }

    // Start transaction to handle potential conflicts
    const result = await sequelize.transaction(async (transaction) => {
      // Find and lock the table
      const table = await Table.findByPk(tableId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!table) {
        throw new NotFoundError('Table not found');
      }

      // Check if table number is being changed and already exists
      if (tableNumber && tableNumber.trim() !== table.tableNumber) {
        const existingTable = await Table.findOne({
          where: { 
            tableNumber: tableNumber.trim(),
            id: { [sequelize.Sequelize.Op.ne]: tableId }
          },
          transaction
        });

        if (existingTable) {
          throw new ConflictError(`Table number "${tableNumber}" already exists`);
        }
      }

      // Check if trying to set status to 'available' when table has active checkout
      if (status === 'available' && table.status !== 'available') {
        const activeCheckout = await Checkout.findOne({
          where: { 
            tableId: table.id, 
            status: 'active' 
          },
          transaction
        });

        if (activeCheckout) {
          throw new ConflictError('Cannot set table to available while it has an active checkout');
        }
      }

      // Update table
      const updatedData = {};
      if (tableNumber) updatedData.tableNumber = tableNumber.trim();
      if (location !== undefined) updatedData.location = location?.trim() || null;
      if (capacity !== undefined) updatedData.capacity = capacity ? parseInt(capacity, 10) : null;
      if (notes !== undefined) updatedData.notes = notes?.trim() || null;
      if (status) updatedData.status = status;

      await table.update(updatedData, { transaction });

      return table;
    });

    res.status(200).json({
      message: 'Table updated successfully',
      table: result
    });

  } catch (error) {
    throw error;
  }
};

// DELETE /api/tables - Delete a table (requires ID in query string)
const handleDelete = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      throw new ValidationError('Table ID is required in query parameters');
    }

    const tableId = parseInt(id, 10);
    if (isNaN(tableId)) {
      throw new ValidationError('Invalid table ID');
    }

    // Start transaction
    await sequelize.transaction(async (transaction) => {
      // Find and lock the table
      const table = await Table.findByPk(tableId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!table) {
        throw new NotFoundError('Table not found');
      }

      // Check if table has active checkouts
      const activeCheckout = await Checkout.findOne({
        where: { 
          tableId: table.id, 
          status: 'active' 
        },
        transaction
      });

      if (activeCheckout) {
        throw new ConflictError('Cannot delete table with active checkout');
      }

      // Soft delete by setting status to maintenance (or hard delete if preferred)
      // For this implementation, we'll do a hard delete but you might want soft delete
      await table.destroy({ transaction });
    });

    res.status(200).json({
      message: 'Table deleted successfully'
    });

  } catch (error) {
    throw error;
  }
};

module.exports = createHandler(handler, 'tables-crud');