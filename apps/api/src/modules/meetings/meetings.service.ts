import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  MeetingStatus,
  MessageType,
  NotificationType,
  Role,
} from '../../../generated/prisma';
import { ChatGateway } from '../chats/chats.gateway';
import { ChatsService, MESSAGE_INCLUDE } from '../chats/chats.service';
import type { CreateMeetingDto } from './dto/create-meeting.dto';
import type { UpdateMeetingStatusDto } from './dto/update-meeting-status.dto';

const MEETING_INCLUDE = {
  client: {
    select: {
      id: true,
      userId: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
  professional: {
    select: { id: true, userId: true, slug: true, businessName: true },
  },
} as const;

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chats: ChatsService,
    private readonly gateway: ChatGateway,
  ) {}

  async create(userId: string, role: Role, dto: CreateMeetingDto) {
    const context = await this.chats.getChatContext(userId, role, dto.chatId);

    const meeting = await this.prisma.meeting.create({
      data: {
        chatId: dto.chatId,
        clientId: context.chat.clientId,
        professionalId: context.chat.professionalId,
        scheduledAt: dto.scheduledAt,
        durationMins: dto.durationMins,
        location: dto.location,
        meetingLink: dto.meetingLink,
        notes: dto.notes,
      },
      include: MEETING_INCLUDE,
    });

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          chatId: dto.chatId,
          senderId: userId,
          type: MessageType.MEETING,
          meetingId: meeting.id,
        },
        include: MESSAGE_INCLUDE,
      }),
      this.prisma.chat.update({
        where: { id: dto.chatId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    await this.chats.notify(
      context.otherUserId,
      NotificationType.MEETING,
      'New meeting proposed',
      `Scheduled for ${new Date(dto.scheduledAt).toLocaleString()}`,
      { chatId: dto.chatId, meetingId: meeting.id },
    );

    this.gateway.broadcast(dto.chatId, 'message:new', message);

    return meeting;
  }

  async findMine(userId: string, role: Role, query: PaginationQueryDto) {
    const myProfileId = await this.chats.getMyProfileId(userId, role);
    const where =
      role === Role.CLIENT
        ? { clientId: myProfileId }
        : { professionalId: myProfileId };

    const [items, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        include: MEETING_INCLUDE,
        skip: query.skip,
        take: query.limit,
        orderBy: { scheduledAt: query.sortOrder },
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  private async getOwned(userId: string, role: Role, id: string) {
    const myProfileId = await this.chats.getMyProfileId(userId, role);
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: MEETING_INCLUDE,
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const owns =
      role === Role.CLIENT
        ? meeting.clientId === myProfileId
        : meeting.professionalId === myProfileId;
    if (!owns) {
      throw new ForbiddenException('Not a participant in this meeting');
    }

    return meeting;
  }

  findOne(userId: string, role: Role, id: string) {
    return this.getOwned(userId, role, id);
  }

  async updateStatus(
    userId: string,
    role: Role,
    id: string,
    dto: UpdateMeetingStatusDto,
  ) {
    const meeting = await this.getOwned(userId, role, id);

    if (meeting.status !== MeetingStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled meetings can be updated');
    }

    const updated = await this.prisma.meeting.update({
      where: { id },
      data: { status: dto.status },
      include: MEETING_INCLUDE,
    });

    const otherUserId =
      role === Role.CLIENT
        ? meeting.professional.userId
        : meeting.client.userId;
    await this.chats.notify(
      otherUserId,
      NotificationType.MEETING,
      'Meeting updated',
      `The meeting scheduled for ${meeting.scheduledAt.toLocaleString()} is now ${dto.status.toLowerCase().replace('_', ' ')}`,
      { chatId: meeting.chatId, meetingId: meeting.id },
    );

    this.gateway.broadcast(meeting.chatId, 'meeting:updated', updated);

    return updated;
  }
}
