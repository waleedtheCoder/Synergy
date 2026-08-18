import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import type { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';

const PROFILE_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  city: { select: { id: true, name: true } },
  skills: { include: { skill: { select: { id: true, name: true } } } },
  _count: {
    select: { services: true, portfolioProjects: true, certificates: true },
  },
} as const;

@Injectable()
export class ProfessionalProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  private async getProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }

    return profile.id;
  }

  private formatProfile<
    T extends {
      skills: { skill: { id: string; name: string } }[];
      _count: {
        services: number;
        portfolioProjects: number;
        certificates: number;
      };
    },
  >(profile: T) {
    const { skills, _count, ...rest } = profile;
    return {
      ...rest,
      skills: skills.map((s) => s.skill),
      servicesCount: _count.services,
      portfolioCount: _count.portfolioProjects,
      certificatesCount: _count.certificates,
    };
  }

  async findMe(userId: string) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      include: PROFILE_INCLUDE,
    });

    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }

    return this.formatProfile(profile);
  }

  async updateMe(userId: string, dto: UpdateProfessionalProfileDto) {
    const id = await this.getProfileId(userId);
    const { skillIds, ...fields } = dto;

    if (
      fields.hourlyRateMin !== undefined &&
      fields.hourlyRateMax !== undefined &&
      fields.hourlyRateMin > fields.hourlyRateMax
    ) {
      throw new BadRequestException(
        'Minimum hourly rate cannot exceed maximum hourly rate',
      );
    }

    await this.prisma.$transaction([
      ...(Object.keys(fields).length > 0
        ? [
            this.prisma.professionalProfile.update({
              where: { id },
              data: fields,
            }),
          ]
        : []),
      ...(skillIds !== undefined
        ? [
            this.prisma.professionalSkill.deleteMany({
              where: { professionalId: id },
            }),
            ...(skillIds.length > 0
              ? [
                  this.prisma.professionalSkill.createMany({
                    data: skillIds.map((skillId) => ({
                      professionalId: id,
                      skillId,
                    })),
                  }),
                ]
              : []),
          ]
        : []),
    ]);

    void this.searchService.indexProfessionalById(id);

    return this.findMe(userId);
  }
}
