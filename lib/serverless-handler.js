// Production-ready serverless handler with proper middleware pattern
const { initializeDatabase } = require('./database');
const { v4: uuidv4 } = require('uuid');
const pino = require('pino');
const { AppError } = require('./errors');

// Configure structured logging
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level(label) {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// CORS configuration
const getAllowedOrigins = () => {
  const origins = process.env.CORS_ORIGINS;
  if (!origins) {
    // Default: allow localhost in development, nothing in production
    return process.env.NODE_ENV === 'development' 
      ? ['http://localhost:3000', 'http://localhost:3001'] 
      : [];
  }
  return origins.split(',').map(origin => origin.trim());
};

// CORS middleware
const corsMiddleware = (req, res) => {
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin'); // Critical for CDN/browser caching
  } else if (process.env.NODE_ENV === 'development') {
    // Allow wildcard only in development
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
};

// Logging middleware
const loggingMiddleware = (req, requestId) => {
  logger.info({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    timestamp: new Date().toISOString()
  }, 'Incoming request');
};

// Response wrapper to capture status codes
const wrapResponse = (res, requestId, endpointName, startTime) => {
  const originalEnd = res.end;
  const originalSend = res.send;
  const originalJson = res.json;
  
  const logResponse = () => {
    const duration = Date.now() - startTime;
    logger.info({
      requestId,
      endpoint: endpointName,
      statusCode: res.statusCode,
      duration
    }, 'Request completed');
  };
  
  res.end = function(...args) {
    logResponse();
    return originalEnd.apply(this, args);
  };
  
  res.send = function(...args) {
    logResponse();
    return originalSend.apply(this, args);
  };
  
  res.json = function(...args) {
    logResponse();
    return originalJson.apply(this, args);
  };
};

// Error handling middleware
const errorMiddleware = (error, req, res, requestId, startTime, endpointName) => {
  const duration = Date.now() - startTime;
  
  // Determine status code
  const statusCode = error.statusCode || (error instanceof AppError ? error.statusCode : 500);
  
  logger.error({
    requestId,
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    endpoint: endpointName,
    method: req.method,
    url: req.url,
    statusCode,
    duration
  }, 'Request failed');
  
  res.status(statusCode).json({ 
    error: statusCode >= 500 ? 'Internal server error' : error.message,
    requestId,
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

const createHandler = (handlerFn, endpointName = 'unknown') => {
  return async (req, res) => {
    const startTime = Date.now();
    const requestId = uuidv4();
    
    try {
      // Apply CORS middleware
      corsMiddleware(req, res);
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        logger.info({ requestId }, 'OPTIONS request handled');
        res.status(200).end();
        return;
      }
      
      // Apply logging middleware
      loggingMiddleware(req, requestId);
      
      // Wrap response for status code logging
      wrapResponse(res, requestId, endpointName, startTime);
      
      // Database should already be initialized at module level
      // Just ensure it's ready (idempotent check)
      await initializeDatabase();
      
      // Call the actual handler
      await handlerFn(req, res);
      
    } catch (error) {
      errorMiddleware(error, req, res, requestId, startTime, endpointName);
    }
  };
};

module.exports = { createHandler };