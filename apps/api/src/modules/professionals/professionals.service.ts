import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const PROFILE_INCLUDE = {
  user: { select: { firstName: true, lastName: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
  city: { select: { id: true, name: true } },
  skills: { include: { skill: { select: { id: true, name: true } } } },
  certificates: {
    select: {
      id: true,
      title: true,
      issuer: true,
      issueDate: true,
      fileUrl: true,
      verified: true,
    },
  },
  services: {
    where: { active: true },
    include: { category: { select: { id: true, name: true, slug: true } } },
  },
  portfolioProjects: {
    where: { published: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { order: 'asc' as const } },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { slug },
      include: PROFILE_INCLUDE,
    });

    if (!profile) {
      throw new NotFoundException('Professional not found');
    }

    await this.prisma.professionalProfile.update({
      where: { id: profile.id },
      data: { profileViewsCount: { increment: 1 } },
    });

    const { skills, ...rest } = profile;
    return {
      ...rest,
      skills: skills.map((professionalSkill) => professionalSkill.skill),
    };
  }
}
