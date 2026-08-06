import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        emailVerified: true,
        clientProfile: { select: { address: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { clientProfile, ...rest } = user;
    return { ...rest, address: clientProfile?.address ?? null };
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const { address, ...userFields } = dto;

    await this.prisma.$transaction([
      ...(Object.keys(userFields).length > 0
        ? [
            this.prisma.user.update({
              where: { id: userId },
              data: userFields,
            }),
          ]
        : []),
      ...(address !== undefined
        ? [
            this.prisma.clientProfile.updateMany({
              where: { userId },
              data: { address },
            }),
          ]
        : []),
    ]);

    return this.findMe(userId);
  }
}
