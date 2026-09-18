import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateAdvertiserDto } from './dto/create-advertiser.dto';

@Injectable()
export class AdvertisersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdvertiserId(userId: string): Promise<string> {
    const advertiser = await this.prisma.advertiser.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!advertiser) {
      throw new NotFoundException(
        'You are not registered as an advertiser yet',
      );
    }

    return advertiser.id;
  }

  async findMe(userId: string) {
    const advertiser = await this.prisma.advertiser.findUnique({
      where: { userId },
    });

    if (!advertiser) {
      throw new NotFoundException(
        'You are not registered as an advertiser yet',
      );
    }

    return advertiser;
  }

  async create(userId: string, dto: CreateAdvertiserDto) {
    const existing = await this.prisma.advertiser.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException(
        'You are already registered as an advertiser',
      );
    }

    return this.prisma.advertiser.create({
      data: {
        userId,
        companyName: dto.companyName,
        billingEmail: dto.billingEmail,
      },
    });
  }
}
