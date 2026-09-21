import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slug.util';
import { AdminAuditLogService } from './admin-audit-log.service';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AdminAuditLogService,
  ) {}

  async create(dto: CreateCategoryDto, adminId: string, ipAddress?: string) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException('A category with this name already exists');
    }

    if (dto.parentId) {
      await this.assertParentExists(dto.parentId);
    }

    const created = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        icon: dto.icon,
        parentId: dto.parentId,
      },
    });

    await this.auditLog.log({
      adminId,
      action: 'category.create',
      targetType: 'category',
      targetId: created.id,
      metadata: { name: dto.name },
      ipAddress,
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
    adminId: string,
    ipAddress?: string,
  ) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      await this.assertParentExists(dto.parentId);
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        icon: dto.icon,
        parentId: dto.parentId,
        ...(dto.name ? { slug: slugify(dto.name) } : {}),
      },
    });

    await this.auditLog.log({
      adminId,
      action: 'category.update',
      targetType: 'category',
      targetId: id,
      metadata: { name: dto.name },
      ipAddress,
    });

    return updated;
  }

  async remove(id: string, adminId: string, ipAddress?: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: { select: { id: true } } },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete a category that has subcategories',
      );
    }

    await this.prisma.category.delete({ where: { id } });
    await this.auditLog.log({
      adminId,
      action: 'category.delete',
      targetType: 'category',
      targetId: id,
      metadata: { name: category.name },
      ipAddress,
    });
  }

  private async assertParentExists(parentId: string): Promise<void> {
    const parent = await this.prisma.category.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      throw new BadRequestException('Parent category not found');
    }
  }
}
