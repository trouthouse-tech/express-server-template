/**
 * Setup Error Handling Middleware
 * Handles errors and sends appropriate responses
 */

import { Express, Request, Response, NextFunction } from 'express';

export const setupErrorHandling = (app: Express): void => {
  // 404 handler - must be after all routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
    });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);

    res.status(500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });
};
