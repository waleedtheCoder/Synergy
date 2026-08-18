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
  MessageType,
  NotificationType,
  ProjectRequestStatus,
  QuotationStatus,
  Role,
} from '../../../generated/prisma';
import { ChatGateway } from '../chats/chats.gateway';
import { ChatsService, MESSAGE_INCLUDE } from '../chats/chats.service';
import type { CreateQuotationDto } from './dto/create-quotation.dto';
import type { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';

const QUOTATION_INCLUDE = {
  items: true,
  professional: {
    select: { id: true, userId: true, slug: true, businessName: true },
  },
  client: {
    select: {
      id: true,
      userId: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
} as const;

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chats: ChatsService,
    private readonly gateway: ChatGateway,
  ) {}

  async create(userId: string, role: Role, dto: CreateQuotationDto) {
    const context = await this.chats.getChatContext(userId, role, dto.chatId);

    const items = dto.items.map((item) => {
      const quantity = item.quantity ?? 1;
      return {
        description: item.description,
        quantity,
        unitPrice: item.unitPrice,
        total: quantity * item.unitPrice,
      };
    });
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    const quotation = await this.prisma.quotation.create({
      data: {
        chatId: dto.chatId,
        projectRequestId: dto.projectRequestId,
        professionalId: context.chat.professionalId,
        clientId: context.chat.clientId,
        status: QuotationStatus.SENT,
        totalAmount,
        notes: dto.notes,
        validUntil: dto.validUntil,
        items: { create: items },
      },
      include: QUOTATION_INCLUDE,
    });

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          chatId: dto.chatId,
          senderId: userId,
          type: MessageType.QUOTATION,
          quotationId: quotation.id,
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
      NotificationType.QUOTATION,
      'New quotation received',
      `A quotation for $${totalAmount.toLocaleString()} is waiting for your review`,
      { chatId: dto.chatId, quotationId: quotation.id },
    );

    this.gateway.broadcast(dto.chatId, 'message:new', message);

    return quotation;
  }

  async findMine(userId: string, role: Role, query: PaginationQueryDto) {
    const myProfileId = await this.chats.getMyProfileId(userId, role);
    const where =
      role === Role.CLIENT
        ? { clientId: myProfileId }
        : { professionalId: myProfileId };

    const [items, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        include: QUOTATION_INCLUDE,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  private async getOwned(userId: string, role: Role, id: string) {
    const myProfileId = await this.chats.getMyProfileId(userId, role);
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: QUOTATION_INCLUDE,
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    const owns =
      role === Role.CLIENT
        ? quotation.clientId === myProfileId
        : quotation.professionalId === myProfileId;
    if (!owns) {
      throw new ForbiddenException('Not a participant in this quotation');
    }

    return quotation;
  }

  findOne(userId: string, role: Role, id: string) {
    return this.getOwned(userId, role, id);
  }

  async updateStatus(
    userId: string,
    id: string,
    dto: UpdateQuotationStatusDto,
  ) {
    const quotation = await this.getOwned(userId, Role.CLIENT, id);

    if (quotation.status !== QuotationStatus.SENT) {
      throw new BadRequestException(
        'Only sent quotations can be accepted or rejected',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.quotation.update({
        where: { id },
        data: { status: dto.status },
        include: QUOTATION_INCLUDE,
      });

      if (dto.status === 'ACCEPTED' && result.projectRequestId) {
        await tx.projectRequest.updateMany({
          where: {
            id: result.projectRequestId,
            status: ProjectRequestStatus.OPEN,
          },
          data: {
            status: ProjectRequestStatus.IN_PROGRESS,
            awardedProfessionalId: result.professionalId,
          },
        });
      }

      return result;
    });

    await this.chats.notify(
      quotation.professional.userId,
      NotificationType.QUOTATION,
      dto.status === 'ACCEPTED' ? 'Quotation accepted' : 'Quotation rejected',
      `Your $${Number(quotation.totalAmount).toLocaleString()} quotation was ${dto.status.toLowerCase()}`,
      { chatId: quotation.chatId, quotationId: quotation.id },
    );

    this.gateway.broadcast(quotation.chatId, 'quotation:updated', updated);

    return updated;
  }
}
