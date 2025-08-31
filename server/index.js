const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const sequelize = require('./config/database');
const { Organization, Table, Checkout } = require('./models');

const organizationsRouter = require('./routes/organizations');
const tablesRouter = require('./routes/tables');
const checkoutsRouter = require('./routes/checkouts');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production'
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/organizations', organizationsRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/checkouts', checkoutsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'ITS Table Checkout Management System API',
    version: '1.0.0',
    endpoints: {
      organizations: '/api/organizations',
      tables: '/api/tables',
      checkouts: '/api/checkouts',
      health: '/api/health',
    },
  });
});

// Serve static files from React app build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Catch all handler: send back React's index.html file
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
} else {
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });
}

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database connection lazily
let databaseInitialized = false;
let initializationPromise = null;

async function ensureDatabaseConnection() {
  if (databaseInitialized) {
    return;
  }
  
  if (initializationPromise) {
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    try {
      console.log('Testing database connection...');
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
      databaseInitialized = true;
      
      // Only sync in development - use migrations in production
      if (process.env.NODE_ENV !== 'production') {
        console.log('Synchronizing database models...');
        await sequelize.sync({ alter: true });
        console.log('Database models synchronized successfully.');
      }
    } catch (error) {
      console.error('Database initialization failed:', error);
      // Don't exit in serverless environment
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
      throw error;
    }
  })();
  
  return initializationPromise;
}

// Middleware to ensure database connection before handling requests
app.use(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Only start server in development
if (require.main === module && process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`Health check at http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;