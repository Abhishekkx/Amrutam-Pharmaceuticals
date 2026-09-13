import winston from 'winston';
import { config } from '../config';

export const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'amrutam-telemedicine-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: config.env === 'development' }),
        winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
          const cid = correlationId ? ` [cid: ${correlationId}]` : '';
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] ${level}${cid}: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});
