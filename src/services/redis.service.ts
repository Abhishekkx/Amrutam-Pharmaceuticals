import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

class RedisService {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private fallbackStore: Map<string, { value: string; expiresAt: number }> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: () => null,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Connected to Redis successfully');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.warn(`Redis connection unavailable: ${err.message}. Using in-memory fallback store.`);
      });

      this.client.connect().catch((err) => {
        this.isConnected = false;
        logger.warn(`Redis failed initial connection: ${err.message}. In-memory fallback activated.`);
      });
    } catch (err: any) {
      this.isConnected = false;
      logger.warn(`Failed to initialize Redis client: ${err.message}`);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        this.client.disconnect();
      } catch (e) {
        // Ignore disconnect errors during shutdown
      }
      this.client = null;
      this.isConnected = false;
    }
  }

  public async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (e) {
        logger.warn(`Redis GET error for key ${key}, checking fallback`);
      }
    }
    
    const item = this.fallbackStore.get(key);
    if (!item) return null;
    if (item.expiresAt > 0 && Date.now() > item.expiresAt) {
      this.fallbackStore.delete(key);
      return null;
    }
    return item.value;
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (e) {
        logger.warn(`Redis SET error for key ${key}, falling back to memory`);
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0;
    this.fallbackStore.set(key, { value, expiresAt });
  }

  public async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (e) {
        logger.warn(`Redis DEL error for key ${key}`);
      }
    }
    this.fallbackStore.delete(key);
  }

  public async acquireLock(lockKey: string, ttlSeconds: number = 10): Promise<boolean> {
    if (this.isConnected && this.client) {
      try {
        const result = await this.client.set(lockKey, 'locked', 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      } catch (e) {
        logger.warn(`Redis lock acquire error for ${lockKey}, falling back to memory lock`);
      }
    }

    const item = this.fallbackStore.get(lockKey);
    if (item && (item.expiresAt === 0 || Date.now() < item.expiresAt)) {
      return false;
    }
    this.fallbackStore.set(lockKey, { value: 'locked', expiresAt: Date.now() + ttlSeconds * 1000 });
    return true;
  }

  public async releaseLock(lockKey: string): Promise<void> {
    await this.del(lockKey);
  }
}

export const redisService = new RedisService();
