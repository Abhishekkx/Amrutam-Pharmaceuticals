import { idempotencyMiddleware } from '../../src/middlewares/idempotency.middleware';
import { redisService } from '../../src/services/redis.service';
import { IdempotencyConflictError } from '../../src/utils/errors';

jest.mock('../../src/services/redis.service');

describe('Idempotency Middleware Unit Tests', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      method: 'POST',
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should skip GET requests without processing idempotency', async () => {
    req.method = 'GET';
    await idempotencyMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should throw IdempotencyConflictError if request is currently PROCESSING', async () => {
    req.headers['x-idempotency-key'] = 'key-123';
    (redisService.get as jest.Mock).mockResolvedValue('PROCESSING');

    await idempotencyMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(IdempotencyConflictError));
  });

  it('should return cached response if key was previously completed', async () => {
    req.headers['x-idempotency-key'] = 'key-123';
    const cachedResponse = { statusCode: 201, body: { success: true, data: { id: 'book-1' } } };
    (redisService.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedResponse));

    await idempotencyMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(cachedResponse.body);
  });
});
