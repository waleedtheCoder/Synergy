import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuditLogService } from './admin-audit-log.service';
import type { CreateSkillDto } from './dto/create-skill.dto';

@Injectable()
export class AdminSkillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AdminAuditLogService,
  ) {}

  async create(dto: CreateSkillDto, adminId: string, ipAddress?: string) {
    const existing = await this.prisma.skill.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('A skill with this name already exists');
    }

    const created = await this.prisma.skill.create({
      data: { name: dto.name },
    });

    await this.auditLog.log({
      adminId,
      action: 'skill.create',
      targetType: 'skill',
      targetId: created.id,
      metadata: { name: dto.name },
      ipAddress,
    });

    return created;
  }

  async remove(id: string, adminId: string, ipAddress?: string) {
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
    await this.auditLog.log({
      adminId,
      action: 'skill.delete',
      targetType: 'skill',
      targetId: id,
      metadata: { name: skill.name },
      ipAddress,
    });
  }
}
