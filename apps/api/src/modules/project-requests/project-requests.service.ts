import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectRequestStatus } from '../../../generated/prisma';
import { paginate } from '../../common/dto/pagination-query.dto';
import type { CreateProjectRequestDto } from './dto/create-project-request.dto';
import type { UpdateProjectRequestDto } from './dto/update-project-request.dto';
import type { QueryProjectRequestsDto } from './dto/query-project-requests.dto';

const LIST_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  city: { select: { id: true, name: true } },
  awardedProfessional: {
    select: { id: true, slug: true, businessName: true },
  },
} as const;

@Injectable()
export class ProjectRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getClientProfileId(userId: string): Promise<string> {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!clientProfile) {
      throw new NotFoundException('Client profile not found');
    }

    return clientProfile.id;
  }

  private async getOwned(userId: string, id: string) {
    const clientId = await this.getClientProfileId(userId);
    const projectRequest = await this.prisma.projectRequest.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    });

    if (!projectRequest || projectRequest.clientId !== clientId) {
      throw new NotFoundException('Project request not found');
    }

    return projectRequest;
  }

  async create(userId: string, dto: CreateProjectRequestDto) {
    const clientId = await this.getClientProfileId(userId);

    if (
      dto.budgetMin !== undefined &&
      dto.budgetMax !== undefined &&
      dto.budgetMin > dto.budgetMax
    ) {
      throw new BadRequestException(
        'Minimum budget cannot exceed maximum budget',
      );
    }

    return this.prisma.projectRequest.create({
      data: { clientId, ...dto },
      include: LIST_INCLUDE,
    });
  }

  async findMine(userId: string, query: QueryProjectRequestsDto) {
    const clientId = await this.getClientProfileId(userId);
    const where = {
      clientId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.projectRequest.findMany({
        where,
        include: LIST_INCLUDE,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.projectRequest.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  findOne(userId: string, id: string) {
    return this.getOwned(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateProjectRequestDto) {
    const existing = await this.getOwned(userId, id);

    if (existing.status !== ProjectRequestStatus.OPEN) {
      throw new ForbiddenException('Only open project requests can be edited');
    }

    return this.prisma.projectRequest.update({
      where: { id },
      data: dto,
      include: LIST_INCLUDE,
    });
  }

  async cancel(userId: string, id: string) {
    const existing = await this.getOwned(userId, id);

    if (existing.status !== ProjectRequestStatus.OPEN) {
      throw new ForbiddenException(
        'Only open project requests can be cancelled',
      );
    }

    return this.prisma.projectRequest.update({
      where: { id },
      data: { status: ProjectRequestStatus.CANCELLED },
      include: LIST_INCLUDE,
    });
  }
}
