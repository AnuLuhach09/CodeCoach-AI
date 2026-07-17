import { prisma } from '../config/db';
import { File, Prisma } from '@prisma/client';

export class FileRepository {
  async findById(id: string): Promise<File | null> {
    return prisma.file.findUnique({
      where: { id },
    });
  }

  async findAllByProjectId(projectId: string): Promise<File[]> {
    return prisma.file.findMany({
      where: { projectId },
      orderBy: { path: 'asc' },
    });
  }

  async findByPath(projectId: string, path: string): Promise<File | null> {
    return prisma.file.findFirst({
      where: { projectId, path },
    });
  }

  async create(data: Prisma.FileUncheckedCreateInput): Promise<File> {
    return prisma.file.create({
      data,
    });
  }

  async createMany(data: Prisma.FileCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return prisma.file.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async update(id: string, data: Prisma.FileUpdateInput): Promise<File> {
    return prisma.file.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<File> {
    return prisma.file.delete({
      where: { id },
    });
  }

  async deleteManyByProjectId(projectId: string): Promise<Prisma.BatchPayload> {
    return prisma.file.deleteMany({
      where: { projectId },
    });
  }
}
export const fileRepository = new FileRepository();
