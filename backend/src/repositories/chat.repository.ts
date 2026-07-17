import { prisma } from '../config/db';
import { Chat, Message, Prisma } from '@prisma/client';

export type ChatWithMessages = Chat & { messages: Message[] };

export class ChatRepository {
  async findById(id: string): Promise<ChatWithMessages | null> {
    return prisma.chat.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    }) as Promise<ChatWithMessages | null>;
  }

  async findAllByProjectId(projectId: string): Promise<Chat[]> {
    return prisma.chat.findMany({
      where: { projectId },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  async create(data: Prisma.ChatCreateInput): Promise<Chat> {
    return prisma.chat.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ChatUpdateInput): Promise<Chat> {
    return prisma.chat.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Chat> {
    return prisma.chat.delete({
      where: { id },
    });
  }
}
export const chatRepository = new ChatRepository();
