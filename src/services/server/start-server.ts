/**
 * Start Server
 * Initializes and starts the Express server
 */

import { Express } from 'express';

interface ServerConfig {
  port: number;
  environment: string;
}

export const startServer = (app: Express, config: ServerConfig): void => {
  const { port, environment } = config;

  app.listen(port, () => {
    console.log('');
    console.log('='.repeat(50));
    console.log(`🚀 TroutHouseTech Express Server`);
    console.log('='.repeat(50));
    console.log(`Environment: ${environment}`);
    console.log(`Port: ${port}`);
    console.log(`URL: http://localhost:${port}`);
    console.log(`Health Check: http://localhost:${port}/api/health`);
    console.log('='.repeat(50));
    console.log('');
  });
};
