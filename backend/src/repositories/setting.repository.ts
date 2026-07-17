import { prisma } from '../config/db';
import { Setting, Prisma } from '@prisma/client';

export class SettingRepository {
  async findByUserId(userId: string): Promise<Setting | null> {
    return prisma.setting.findUnique({
      where: { userId },
    });
  }

  async create(data: Prisma.SettingUncheckedCreateInput): Promise<Setting> {
    return prisma.setting.create({
      data,
    });
  }

  async update(userId: string, data: Prisma.SettingUpdateInput): Promise<Setting> {
    return prisma.setting.update({
      where: { userId },
      data,
    });
  }
}
export const settingRepository = new SettingRepository();
