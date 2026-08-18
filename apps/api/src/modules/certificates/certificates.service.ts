import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { CreateCertificateDto } from './dto/create-certificate.dto';

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getProfessionalId(userId: string): Promise<string> {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }

    return profile.id;
  }

  async create(userId: string, dto: CreateCertificateDto) {
    const professionalId = await this.getProfessionalId(userId);

    return this.prisma.certificate.create({
      data: { professionalId, ...dto },
    });
  }

  async findMine(userId: string, query: PaginationQueryDto) {
    const professionalId = await this.getProfessionalId(userId);

    const [items, total] = await Promise.all([
      this.prisma.certificate.findMany({
        where: { professionalId },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.certificate.count({ where: { professionalId } }),
    ]);

    return paginate(items, total, query);
  }

  async remove(userId: string, id: string): Promise<void> {
    const professionalId = await this.getProfessionalId(userId);
    const certificate = await this.prisma.certificate.findUnique({
      where: { id },
      select: { professionalId: true },
    });

    if (!certificate || certificate.professionalId !== professionalId) {
      throw new NotFoundException('Certificate not found');
    }

    await this.prisma.certificate.delete({ where: { id } });
  }
}
