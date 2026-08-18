import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { NotificationType, Role, type Prisma } from '../../../generated/prisma';
import type { CreateChatDto } from './dto/create-chat.dto';

const PARTICIPANT_INCLUDE = {
  client: {
    select: {
      id: true,
      userId: true,
      user: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
  },
  professional: {
    select: {
      id: true,
      userId: true,
      slug: true,
      businessName: true,
      user: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
  },
} as const;

export const MESSAGE_INCLUDE = {
  sender: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  },
  quotation: { include: { items: true } },
  meeting: true,
} as const;

export interface ChatContext {
  chat: { id: string; clientId: string; professionalId: string };
  isClient: boolean;
  otherUserId: string;
}

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfileId(userId: string, role: Role): Promise<string> {
    if (role === Role.CLIENT) {
      const profile = await this.prisma.clientProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!profile) throw new NotFoundException('Client profile not found');
      return profile.id;
    }

    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Professional profile not found');
    return profile.id;
  }

  async getChatContext(
    userId: string,
    role: Role,
    chatId: string,
  ): Promise<ChatContext> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: {
        id: true,
        clientId: true,
        professionalId: true,
        client: { select: { userId: true } },
        professional: { select: { userId: true } },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const myProfileId = await this.getMyProfileId(userId, role);
    const isClient = role === Role.CLIENT;

    if (
      isClient
        ? chat.clientId !== myProfileId
        : chat.professionalId !== myProfileId
    ) {
      throw new ForbiddenException('Not a participant in this chat');
    }

    return {
      chat: {
        id: chat.id,
        clientId: chat.clientId,
        professionalId: chat.professionalId,
      },
      isClient,
      otherUserId: isClient ? chat.professional.userId : chat.client.userId,
    };
  }

  async startChat(userId: string, role: Role, dto: CreateChatDto) {
    const myProfileId = await this.getMyProfileId(userId, role);
    const clientId = role === Role.CLIENT ? myProfileId : dto.counterpartId;
    const professionalId =
      role === Role.CLIENT ? dto.counterpartId : myProfileId;

    const counterpartExists =
      role === Role.CLIENT
        ? await this.prisma.professionalProfile.findUnique({
            where: { id: professionalId },
            select: { id: true },
          })
        : await this.prisma.clientProfile.findUnique({
            where: { id: clientId },
            select: { id: true },
          });

    if (!counterpartExists) {
      throw new NotFoundException('Recipient not found');
    }

    const existing = await this.prisma.chat.findUnique({
      where: { clientId_professionalId: { clientId, professionalId } },
      select: { id: true },
    });

    if (existing) {
      return this.prisma.chat.findUniqueOrThrow({
        where: { id: existing.id },
        include: PARTICIPANT_INCLUDE,
      });
    }

    return this.prisma.chat.create({
      data: {
        clientId,
        professionalId,
        projectRequestId: dto.projectRequestId,
      },
      include: PARTICIPANT_INCLUDE,
    });
  }

  async findMine(userId: string, role: Role, query: PaginationQueryDto) {
    const myProfileId = await this.getMyProfileId(userId, role);
    const where =
      role === Role.CLIENT
        ? { clientId: myProfileId }
        : { professionalId: myProfileId };

    const [chats, total] = await Promise.all([
      this.prisma.chat.findMany({
        where,
        include: {
          ...PARTICIPANT_INCLUDE,
          messages: { orderBy: { createdAt: 'desc' as const }, take: 1 },
          _count: {
            select: {
              messages: { where: { senderId: { not: userId }, readAt: null } },
            },
          },
        },
        skip: query.skip,
        take: query.limit,
        orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      }),
      this.prisma.chat.count({ where }),
    ]);

    return paginate(
      chats.map((chat) => {
        const { messages, _count, ...rest } = chat;
        return {
          ...rest,
          lastMessage: messages[0] ?? null,
          unreadCount: _count.messages,
        };
      }),
      total,
      query,
    );
  }

  async findOne(userId: string, role: Role, chatId: string) {
    await this.getChatContext(userId, role, chatId);
    return this.prisma.chat.findUniqueOrThrow({
      where: { id: chatId },
      include: PARTICIPANT_INCLUDE,
    });
  }

  async findMessages(
    userId: string,
    role: Role,
    chatId: string,
    query: PaginationQueryDto,
  ) {
    await this.getChatContext(userId, role, chatId);

    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { chatId },
        include: MESSAGE_INCLUDE,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count({ where: { chatId } }),
    ]);

    return paginate(items.reverse(), total, query);
  }

  async createMessage(
    userId: string,
    role: Role,
    chatId: string,
    content: string,
  ) {
    const context = await this.getChatContext(userId, role, chatId);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { chatId, senderId: userId, content },
        include: MESSAGE_INCLUDE,
      }),
      this.prisma.chat.update({
        where: { id: chatId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    await this.notify(
      context.otherUserId,
      NotificationType.MESSAGE,
      `New message from ${message.sender.firstName}`,
      content.length > 140 ? `${content.slice(0, 140)}…` : content,
      { chatId },
    );

    return message;
  }

  async markRead(userId: string, role: Role, chatId: string): Promise<void> {
    await this.getChatContext(userId, role, chatId);

    await this.prisma.message.updateMany({
      where: { chatId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: { userId, type, title, body, data },
    });
  }
}
