import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import type { Prisma } from '../../../generated/prisma';
import type { QueryAuditLogDto } from './dto/query-audit-log.dto';

export interface AuditLogEntry {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
}

/**
 * Records who did what to which privileged resource, and when. This is the
 * only trail that exists for admin moderation/financial actions (user bans,
 * payment confirmations/refunds, verification approvals, dispute
 * resolutions) — without it those actions are silent and unaccountable if
 * an admin account is ever compromised or misused.
 *
 * Logging failures are swallowed (logged, not thrown) so a logging problem
 * can never block the actual admin action from completing.
 */
@Injectable()
export class AdminAuditLogService {
  private readonly logger = new Logger(AdminAuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          adminId: entry.adminId,
          action: entry.action,
          targetType: entry.targetType,
          targetId: entry.targetId,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log for action "${entry.action}"`,
        error,
      );
    }
  }

  async findAll(query: QueryAuditLogDto) {
    const where = {
      ...(query.adminId ? { adminId: query.adminId } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.targetId ? { targetId: query.targetId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        include: {
          admin: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return paginate(items, total, query);
  }
}
