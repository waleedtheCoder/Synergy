import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import type { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string, query: QueryNotificationsDto) {
    const where = { userId, ...(query.unreadOnly ? { read: false } : {}) };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return { ...paginate(items, total, query), unreadCount };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }
}
