import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import { AdminAuditLogService } from './admin-audit-log.service';
import type { QueryReportsDto } from './dto/query-reports.dto';
import type { ResolveReportDto } from './dto/resolve-report.dto';

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AdminAuditLogService,
  ) {}

  async findAll(query: QueryReportsDto) {
    const where = query.status ? { status: query.status } : {};

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.report.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  async resolve(
    id: string,
    dto: ResolveReportDto,
    adminId: string,
    ipAddress?: string,
  ) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.auditLog.log({
      adminId,
      action: 'report.resolve',
      targetType: 'report',
      targetId: id,
      metadata: { from: report.status, to: dto.status },
      ipAddress,
    });

    return updated;
  }
}
