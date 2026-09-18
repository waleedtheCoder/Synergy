import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import { DisputeStatus } from '../../../generated/prisma';
import type { QueryDisputesDto } from './dto/query-disputes.dto';
import type { ResolveDisputeDto } from './dto/resolve-dispute.dto';

const PARTY_SELECT = {
  select: { id: true, firstName: true, lastName: true, email: true },
} as const;

@Injectable()
export class AdminDisputesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async resolve(id: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    const isFinal =
      dto.status === DisputeStatus.RESOLVED ||
      dto.status === DisputeStatus.REJECTED;

    return this.prisma.dispute.update({
      where: { id },
      data: {
        status: dto.status,
        resolution: dto.resolution,
        resolvedAt: isFinal ? new Date() : null,
      },
    });
  }
}
