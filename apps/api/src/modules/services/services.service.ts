import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { CreateServiceDto } from './dto/create-service.dto';
import type { UpdateServiceDto } from './dto/update-service.dto';

const LIST_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
} as const;

@Injectable()
export class ServicesService {
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

  private async getOwned(userId: string, id: string) {
    const professionalId = await this.getProfessionalId(userId);
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    });

    if (!service || service.professionalId !== professionalId) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  private assertPriceRange(dto: { minPrice?: number; maxPrice?: number }) {
    if (
      dto.minPrice !== undefined &&
      dto.maxPrice !== undefined &&
      dto.minPrice > dto.maxPrice
    ) {
      throw new BadRequestException(
        'Minimum price cannot exceed maximum price',
      );
    }
  }

  async create(userId: string, dto: CreateServiceDto) {
    const professionalId = await this.getProfessionalId(userId);
    this.assertPriceRange(dto);

    return this.prisma.service.create({
      data: { professionalId, ...dto },
      include: LIST_INCLUDE,
    });
  }

  async findMine(userId: string, query: PaginationQueryDto) {
    const professionalId = await this.getProfessionalId(userId);

    const [items, total] = await Promise.all([
      this.prisma.service.findMany({
        where: { professionalId },
        include: LIST_INCLUDE,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.service.count({ where: { professionalId } }),
    ]);

    return paginate(items, total, query);
  }

  findOne(userId: string, id: string) {
    return this.getOwned(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateServiceDto) {
    await this.getOwned(userId, id);
    this.assertPriceRange(dto);

    return this.prisma.service.update({
      where: { id },
      data: dto,
      include: LIST_INCLUDE,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwned(userId, id);
    await this.prisma.service.delete({ where: { id } });
  }
}
