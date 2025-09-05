// Shared database connection for serverless functions
const path = require('path');
const sequelize = require('../server/config/database');

// Import models directly to avoid path issues
const Organization = require('../server/models/Organization');
const Table = require('../server/models/Table');
const Checkout = require('../server/models/Checkout');

// Set up associations (from models/index.js)
Organization.hasMany(Checkout, { foreignKey: 'organizationId' });
Checkout.belongsTo(Organization, { foreignKey: 'organizationId' });
Table.hasMany(Checkout, { foreignKey: 'tableId' });
Checkout.belongsTo(Table, { foreignKey: 'tableId' });

// Connection state management for serverless
let isConnected = false;
let connectionPromise = null;

// Initialize database connection at module level (cold start)
const initializeDatabase = async () => {
  // If already connected, return immediately
  if (isConnected) return;
  
  // If initialization is in progress, wait for it
  if (connectionPromise) return connectionPromise;
  
  // Start initialization
  connectionPromise = (async () => {
    try {
      // Test the connection
      await sequelize.authenticate();
      isConnected = true;
      console.log('Database connection pool established at module level');
    } catch (error) {
      console.error('Database connection failed:', error);
      // Reset state on failure
      isConnected = false;
      connectionPromise = null;
      throw error;
    }
  })();
  
  return connectionPromise;
};

// Initialize immediately when module is loaded (cold start optimization)
initializeDatabase().catch(error => {
  console.error('Failed to initialize database at module level:', error);
  // Don't throw here - let individual requests handle the error
});

module.exports = {
  Organization,
  Table,
  Checkout,
  sequelize,
  initializeDatabase
};