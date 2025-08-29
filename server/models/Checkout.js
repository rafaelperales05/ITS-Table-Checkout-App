const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Checkout = sequelize.define('Checkout', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  organizationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'organization_id',
    references: {
      model: 'organizations',
      key: 'id',
    },
  },
  tableId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'table_id',
    references: {
      model: 'tables',
      key: 'id',
    },
  },
  checkoutTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'checkout_time',
  },
  expectedReturnTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expected_return_time',
  },
  actualReturnTime: {
    type: DataTypes.DATE,
    field: 'actual_return_time',
  },
  status: {
    type: DataTypes.ENUM('active', 'returned', 'overdue'),
    defaultValue: 'active',
  },
  notes: {
    type: DataTypes.TEXT,
  },
  checkedOutBy: {
    type: DataTypes.STRING,
    field: 'checked_out_by',
  },
  returnedBy: {
    type: DataTypes.STRING,
    field: 'returned_by',
  },
}, {
  tableName: 'checkouts',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Checkout;