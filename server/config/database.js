const { Sequelize } = require('sequelize');
require('dotenv').config();

// Support both individual params (development) and DATABASE_URL (production)
let sequelize;

if (process.env.DATABASE_URL) {
  // Production: use DATABASE_URL (Railway, Supabase, Neon, etc.)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: {
      max: 1, // Serverless - use minimal connections
      min: 0,
      acquire: 10000, // Reduced timeout for serverless
      idle: 5000,
    },
  });
} else {
  // Development: use individual parameters
  sequelize = new Sequelize({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'table_checkout_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password123',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 1, // Serverless - use minimal connections
      min: 0,
      acquire: 10000, // Reduced timeout for serverless
      idle: 5000,
    },
  });
}

module.exports = sequelize;