import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';
import { Role } from '../constants/enums';
import { auditLogRepository } from '../repositories/auditLog.repository';

export class AuthService {
  public async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
    phone?: string;
  }, correlationId?: string, ipAddress?: string) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const role = data.role || Role.PATIENT;

    const user = await userRepository.createUser({
      email: data.email,
      passwordHash,
      role,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });

    await auditLogRepository.create({
      actorId: user.id,
      action: 'USER_REGISTERED',
      resource: 'User',
      resourceId: user.id,
      correlationId,
      ipAddress,
    });

    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role as Role });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role as Role });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      accessToken,
      refreshToken,
    };
  }

  public async login(data: { email: string; password: string }, correlationId?: string, ipAddress?: string) {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      await auditLogRepository.create({
        action: 'AUTH_FAILED',
        resource: 'User',
        correlationId,
        ipAddress,
        metadata: { email: data.email, reason: 'User not found' },
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      await auditLogRepository.create({
        actorId: user.id,
        action: 'AUTH_FAILED',
        resource: 'User',
        resourceId: user.id,
        correlationId,
        ipAddress,
        metadata: { reason: 'Invalid password' },
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    await auditLogRepository.create({
      actorId: user.id,
      action: 'USER_LOGIN_SUCCESS',
      resource: 'User',
      resourceId: user.id,
      correlationId,
      ipAddress,
    });

    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role as Role });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role as Role });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        doctor: user.doctor,
      },
      accessToken,
      refreshToken,
    };
  }
}

export const authService = new AuthService();
