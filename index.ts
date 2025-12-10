import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Early middleware setup
import { setupEarlyMiddleware } from './src/services/middleware';
setupEarlyMiddleware(app);

// Health check routes
import { createHealthRouter } from './src/services/health';
app.use('/', createHealthRouter());
app.use('/api/health', createHealthRouter());

// Error handling middleware (must be after all routes)
import { setupErrorHandling } from './src/services/middleware';
setupErrorHandling(app);

// Start server
import { startServer } from './src/services/server';
startServer(app, {
  port: PORT,
  environment: process.env.NODE_ENV || 'development'
});

export default app;
