const express = require('express');
const { Table, Checkout, Organization } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { status, available } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (available === 'true') where.status = 'available';
    
    const tables = await Table.findAll({
      where,
      include: [
        {
          model: Checkout,
          where: { status: 'active' },
          required: false,
          include: [{ model: Organization }],
        },
      ],
      order: [['tableNumber', 'ASC']],
    });
    
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const table = await Table.findByPk(req.params.id, {
      include: [
        {
          model: Checkout,
          include: [{ model: Organization }],
          order: [['checkoutTime', 'DESC']],
        },
      ],
    });
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    res.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ error: 'Failed to fetch table' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { tableNumber, location, capacity, notes } = req.body;
    
    if (!tableNumber) {
      return res.status(400).json({ error: 'Table number is required' });
    }
    
    const table = await Table.create({
      tableNumber,
      location,
      capacity,
      notes,
      status: 'available',
    });
    
    res.status(201).json(table);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Table with this number already exists' });
    }
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { tableNumber, location, capacity, notes, status } = req.body;
    
    const table = await Table.findByPk(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    await table.update({
      ...(tableNumber && { tableNumber }),
      ...(location !== undefined && { location }),
      ...(capacity !== undefined && { capacity }),
      ...(notes !== undefined && { notes }),
      ...(status && { status }),
    });
    
    res.json(table);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const table = await Table.findByPk(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    const activeCheckout = await Checkout.findOne({
      where: { tableId: req.params.id, status: 'active' },
    });
    
    if (activeCheckout) {
      return res.status(400).json({ error: 'Cannot delete table with active checkout' });
    }
    
    await table.destroy();
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

module.exports = router;