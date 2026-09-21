import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import { DisputeStatus } from '../../../generated/prisma';
import { AdminAuditLogService } from './admin-audit-log.service';
import type { QueryDisputesDto } from './dto/query-disputes.dto';
import type { ResolveDisputeDto } from './dto/resolve-dispute.dto';

const PARTY_SELECT = {
  select: { id: true, firstName: true, lastName: true, email: true },
} as const;

@Injectable()
export class AdminDisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AdminAuditLogService,
  ) {}

  async findAll(query: QueryDisputesDto) {
    const where = query.status ? { status: query.status } : {};

    const [items, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        include: { raisedBy: PARTY_SELECT, against: PARTY_SELECT },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  async resolve(
    id: string,
    dto: ResolveDisputeDto,
    adminId: string,
    ipAddress?: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const isFinal =
      dto.status === DisputeStatus.RESOLVED ||
      dto.status === DisputeStatus.REJECTED;

    const updated = await this.prisma.dispute.update({
      where: { id },
      data: {
        status: dto.status,
        resolution: dto.resolution,
        resolvedAt: isFinal ? new Date() : null,
      },
    });

    await this.auditLog.log({
      adminId,
      action: 'dispute.resolve',
      targetType: 'dispute',
      targetId: id,
      metadata: { from: dispute.status, to: dto.status },
      ipAddress,
    });

    return updated;
  }
}
