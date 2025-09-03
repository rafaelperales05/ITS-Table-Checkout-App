// Shared database connection for serverless functions
const { Organization, Table, Checkout } = require('../server/models');
const sequelize = require('../server/config/database');

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