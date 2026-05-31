/**
 * Main Express server for Parcel Research Tool
 */
'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { initDatabase } = require('./config/database');

// Import route handlers
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const searchRoutes = require('./routes/search');
const compsRoutes = require('./routes/comps');
const calculatorRoutes = require('./routes/calculator');
const leadsRoutes = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/comps', compsRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/leads', leadsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
async function start() {
  await initDatabase();

  const server = app.listen(PORT, () => {
    console.log(`🏠 Parcel Research Tool API running on http://localhost:${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
