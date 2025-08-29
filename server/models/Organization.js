const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  officialName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'official_name',
  },
  aliases: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
  },
  category: {
    type: DataTypes.STRING(100),
  },
  status: {
    type: DataTypes.ENUM('active', 'banned'),
    defaultValue: 'active',
  },
  banReason: {
    type: DataTypes.TEXT,
    field: 'ban_reason',
  },
  banDate: {
    type: DataTypes.DATE,
    field: 'ban_date',
  },
  scrapedDate: {
    type: DataTypes.DATE,
    field: 'scraped_date',
  },
}, {
  tableName: 'organizations',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Organization;