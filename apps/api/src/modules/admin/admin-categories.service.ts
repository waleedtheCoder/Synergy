import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slug.util';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
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

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        icon: dto.icon,
        parentId: dto.parentId,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
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

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        icon: dto.icon,
        parentId: dto.parentId,
        ...(dto.name ? { slug: slugify(dto.name) } : {}),
      },
    });
  }

  async remove(id: string) {
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
