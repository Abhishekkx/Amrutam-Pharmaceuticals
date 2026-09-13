import { generateAccessToken, verifyAccessToken } from '../../src/utils/jwt';
import { hashPassword, comparePassword } from '../../src/utils/password';
import { Role } from '../../src/constants/enums';

describe('Auth Utility & Hashing Tests', () => {
  it('should hash password and verify correctly', async () => {
    const raw = 'SecurePass123!';
    const hash = await hashPassword(raw);

    expect(hash).not.toEqual(raw);
    const isValid = await comparePassword(raw, hash);
    expect(isValid).toBe(true);

    const isInvalid = await comparePassword('WrongPass', hash);
    expect(isInvalid).toBe(false);
  });

  it('should sign and verify JWT tokens accurately', () => {
    const payload = { userId: 'user-123', email: 'test@amrutam.com', role: Role.PATIENT };
    const token = generateAccessToken(payload);

    expect(typeof token).toBe('string');
    const decoded = verifyAccessToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });
});
