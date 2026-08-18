import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { CreatePortfolioProjectDto } from './dto/create-portfolio-project.dto';
import type { UpdatePortfolioProjectDto } from './dto/update-portfolio-project.dto';

const LIST_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { order: 'asc' } },
} as const;

@Injectable()
export class PortfolioProjectsService {
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
    const project = await this.prisma.portfolioProject.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    });

    if (!project || project.professionalId !== professionalId) {
      throw new NotFoundException('Portfolio project not found');
    }

    return project;
  }

  private assertBudgetRange(dto: { budgetMin?: number; budgetMax?: number }) {
    if (
      dto.budgetMin !== undefined &&
      dto.budgetMax !== undefined &&
      dto.budgetMin > dto.budgetMax
    ) {
      throw new BadRequestException(
        'Minimum budget cannot exceed maximum budget',
      );
    }
  }

  async create(userId: string, dto: CreatePortfolioProjectDto) {
    const professionalId = await this.getProfessionalId(userId);
    this.assertBudgetRange(dto);
    const { images, ...fields } = dto;

    return this.prisma.portfolioProject.create({
      data: {
        professionalId,
        ...fields,
        images: images ? { create: images } : undefined,
      },
      include: LIST_INCLUDE,
    });
  }

  async findMine(userId: string, query: PaginationQueryDto) {
    const professionalId = await this.getProfessionalId(userId);

    const [items, total] = await Promise.all([
      this.prisma.portfolioProject.findMany({
        where: { professionalId },
        include: LIST_INCLUDE,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.portfolioProject.count({ where: { professionalId } }),
    ]);

    return paginate(items, total, query);
  }

  findOne(userId: string, id: string) {
    return this.getOwned(userId, id);
  }

  async update(userId: string, id: string, dto: UpdatePortfolioProjectDto) {
    await this.getOwned(userId, id);
    this.assertBudgetRange(dto);
    const { images, ...fields } = dto;

    await this.prisma.$transaction([
      this.prisma.portfolioProject.update({ where: { id }, data: fields }),
      ...(images !== undefined
        ? [
            this.prisma.portfolioMedia.deleteMany({
              where: { portfolioProjectId: id },
            }),
            ...(images.length > 0
              ? [
                  this.prisma.portfolioMedia.createMany({
                    data: images.map((image) => ({
                      ...image,
                      portfolioProjectId: id,
                    })),
                  }),
                ]
              : []),
          ]
        : []),
    ]);

    return this.getOwned(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwned(userId, id);
    await this.prisma.portfolioProject.delete({ where: { id } });
  }
}
