import { prisma } from './prisma';
import { Role } from '../constants/enums';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string;
}

export class UserRepository {
  public async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { profile: true, doctor: true },
    });
  }

  public async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true, doctor: true },
    });
  }

  public async createUser(data: CreateUserData) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          },
        },
      },
      include: { profile: true },
    });
  }
}

export const userRepository = new UserRepository();
