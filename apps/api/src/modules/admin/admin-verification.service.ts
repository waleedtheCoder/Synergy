import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import { SearchService } from '../search/search.service';
import { AdminAuditLogService } from './admin-audit-log.service';
import type { QueryProfessionalsDto } from './dto/query-professionals.dto';
import type { QueryCertificatesDto } from './dto/query-certificates.dto';

const PROFESSIONAL_LIST_INCLUDE = {
  user: {
    select: { firstName: true, lastName: true, email: true, avatarUrl: true },
  },
  category: { select: { name: true } },
  _count: { select: { certificates: true } },
} as const;

@Injectable()
export class AdminVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly auditLog: AdminAuditLogService,
  ) {}

  async findProfessionals(query: QueryProfessionalsDto) {
    const where = {
      ...(query.verified !== undefined ? { verified: query.verified } : {}),
      ...(query.search
        ? {
            OR: [
              {
                businessName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                slug: { contains: query.search, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.professionalProfile.findMany({
        where,
        include: PROFESSIONAL_LIST_INCLUDE,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.professionalProfile.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  async setProfessionalVerified(
    id: string,
    verified: boolean,
    adminId: string,
    ipAddress?: string,
  ) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { id },
    });
    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }

    const updated = await this.prisma.professionalProfile.update({
      where: { id },
      data: { verified },
    });

    void this.searchService.indexProfessionalById(id);
    await this.auditLog.log({
      adminId,
      action: 'professional.verified.set',
      targetType: 'professionalProfile',
      targetId: id,
      metadata: { from: profile.verified, to: verified },
      ipAddress,
    });

    return updated;
  }

  async findCertificates(query: QueryCertificatesDto) {
    const where =
      query.verified !== undefined ? { verified: query.verified } : {};

    const [items, total] = await Promise.all([
      this.prisma.certificate.findMany({
        where,
        include: {
          professional: {
            select: {
              id: true,
              slug: true,
              businessName: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.certificate.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  async setCertificateVerified(
    id: string,
    verified: boolean,
    adminId: string,
    ipAddress?: string,
  ) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id },
    });
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const updated = await this.prisma.certificate.update({
      where: { id },
      data: { verified },
    });

    await this.auditLog.log({
      adminId,
      action: 'certificate.verified.set',
      targetType: 'certificate',
      targetId: id,
      metadata: { from: certificate.verified, to: verified },
      ipAddress,
    });

    return updated;
  }
}
