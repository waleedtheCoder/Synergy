import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateSkillDto } from './dto/create-skill.dto';

@Injectable()
export class AdminSkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSkillDto) {
    const existing = await this.prisma.skill.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('A skill with this name already exists');
    }

    return this.prisma.skill.create({ data: { name: dto.name } });
  }

  async remove(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: { _count: { select: { professionals: true } } },
    });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }
    if (skill._count.professionals > 0) {
      throw new BadRequestException(
        'Cannot delete a skill that is in use by professionals',
      );
    }

    await this.prisma.skill.delete({ where: { id } });
  }
}
