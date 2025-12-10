/**
 * Health Check Router
 * Provides endpoints for monitoring server health and status
 */

import { Router, Request, Response } from 'express';

export const createHealthRouter = (): Router => {
  const router = Router();

  /**
   * GET /
   * Basic health check endpoint
   */
  router.get('/', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      message: 'TroutHouseTech Express Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  return router;
};
