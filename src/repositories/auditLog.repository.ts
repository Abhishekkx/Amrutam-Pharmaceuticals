import { prisma } from './prisma';

export interface CreateAuditLogData {
  actorId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  correlationId?: string;
  metadata?: any;
}

export class AuditLogRepository {
  public async create(data: CreateAuditLogData) {
    return prisma.auditLog.create({
      data: {
        actorId: data.actorId || null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId || null,
        ipAddress: data.ipAddress || null,
        correlationId: data.correlationId || null,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      },
    });
  }

  public async findMany(limit: number = 50, offset: number = 0) {
    return prisma.auditLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, email: true, role: true },
        },
      },
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
