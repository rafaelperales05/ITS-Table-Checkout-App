// Shared database connection for serverless functions
const { Organization, Table, Checkout } = require('../server/models');
const sequelize = require('../server/config/database');

// Initialize database connection (for serverless)
let isInitialized = false;

const initializeDatabase = async () => {
  if (isInitialized) return;
  
  try {
    console.log('Initializing database connection...');
    await sequelize.authenticate();
    console.log('Database connection established');
    isInitialized = true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

module.exports = {
  Organization,
  Table,
  Checkout,
  sequelize,
  initializeDatabase
};