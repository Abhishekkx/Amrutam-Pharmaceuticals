import { prisma } from '../repositories/prisma';
import { redisService } from './redis.service';

export class AnalyticsService {
  public async getDashboardMetrics() {
    const cacheKey = 'analytics:dashboard';
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const [
      totalUsers,
      totalDoctors,
      totalConsultations,
      consultationsByStatus,
      totalRevenue,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.doctor.count(),
      prisma.consultation.count(),
      prisma.consultation.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const statusCounts = consultationsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    const metrics = {
      overview: {
        totalUsers,
        totalDoctors,
        totalConsultations,
        totalRevenueINR: totalRevenue._sum.amount || 0,
      },
      consultations: {
        scheduled: statusCounts['SCHEDULED'] || 0,
        inProgress: statusCounts['IN_PROGRESS'] || 0,
        completed: statusCounts['COMPLETED'] || 0,
        cancelled: statusCounts['CANCELLED'] || 0,
      },
      recentActivity: recentAuditLogs,
      timestamp: new Date().toISOString(),
    };

    await redisService.set(cacheKey, JSON.stringify(metrics), 60); // 1 min cache
    return metrics;
  }
}

export const analyticsService = new AnalyticsService();
