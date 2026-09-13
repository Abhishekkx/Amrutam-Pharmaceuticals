import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

let prismaInstance: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    // @ts-ignore
    prismaInstance.$on('query', (e: any) => {
      if (process.env.NODE_ENV === 'development' && e.duration > 100) {
        logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
      }
    });
  }
  return prismaInstance;
};

export const prisma = getPrismaClient();
