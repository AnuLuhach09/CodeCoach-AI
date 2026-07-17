import { prisma } from '../config/db';
import { ActivityLog, Prisma } from '@prisma/client';

export class ActivityLogRepository {
  async findAllByUserId(userId: string, limit: number = 20): Promise<ActivityLog[]> {
    return prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async create(data: Prisma.ActivityLogUncheckedCreateInput): Promise<ActivityLog> {
    return prisma.activityLog.create({
      data,
    });
  }
}
export const activityLogRepository = new ActivityLogRepository();
