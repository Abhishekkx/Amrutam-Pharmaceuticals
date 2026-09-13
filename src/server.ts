import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './repositories/prisma';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`🚀 Amrutam Telemedicine Backend listening on port ${config.port} [${config.env}]`);
  logger.info(`Metrics endpoint available at http://localhost:${config.port}/metrics`);
  logger.info(`Health check available at http://localhost:${config.port}/health`);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed.');
      process.exit(0);
    } catch (err: any) {
      logger.error(`Error during shutdown: ${err.message}`);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { server };
