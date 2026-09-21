import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthProvider, UserStatus } from '../../../generated/prisma';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { DeleteAccountDto } from './dto/delete-account.dto';

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

  // ── GDPR self-service: data export ─────────────────────────────────

  async exportMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        authProvider: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        emailVerified: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        clientProfile: true,
        professionalProfile: true,
        sentMessages: {
          select: {
            id: true,
            chatId: true,
            type: true,
            content: true,
            createdAt: true,
          },
        },
        notifications: true,
        reviewsWritten: true,
        payments: {
          select: {
            id: true,
            type: true,
            status: true,
            amount: true,
            currency: true,
            method: true,
            createdAt: true,
          },
        },
        reportsFiled: true,
        disputesRaised: true,
        disputesAgainst: true,
        questionsAsked: true,
        projectLikes: true,
        projectBookmarks: true,
        comments: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { exportedAt: new Date().toISOString(), ...user };
  }

  // ── GDPR self-service: account deletion (soft delete + anonymize) ──

  async deleteMe(userId: string, dto: DeleteAccountDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.authProvider === AuthProvider.LOCAL) {
      if (
        !user.passwordHash ||
        !dto.password ||
        !(await bcrypt.compare(dto.password, user.passwordHash))
      ) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.DEACTIVATED,
          deletedAt: new Date(),
          email: `deleted-${userId}@deleted.synergi.local`,
          phone: null,
          firstName: 'Deleted',
          lastName: 'User',
          avatarUrl: null,
          passwordHash: null,
          googleId: null,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorRecoveryCodes: [],
        },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
