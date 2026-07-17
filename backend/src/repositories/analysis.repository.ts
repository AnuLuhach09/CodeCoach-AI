import { prisma } from '../config/db';
import { Analysis, Prisma } from '@prisma/client';

export class AnalysisRepository {
  async findById(id: string): Promise<Analysis | null> {
    return prisma.analysis.findUnique({
      where: { id },
      include: { repository: true },
    });
  }

  async findAllByProjectId(projectId: string): Promise<Analysis[]> {
    return prisma.analysis.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: { repository: true },
    });
  }

  async create(data: Prisma.AnalysisUncheckedCreateInput): Promise<Analysis> {
    return prisma.analysis.create({
      data,
    });
  }

  async update(id: string, data: Prisma.AnalysisUpdateInput): Promise<Analysis> {
    return prisma.analysis.update({
      where: { id },
      data,
    });
  }
}
export const analysisRepository = new AnalysisRepository();
