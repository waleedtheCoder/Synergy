import { ForbiddenException, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EmbeddingSourceType,
  MessageType,
  Role,
} from '../../../generated/prisma';
import { ChatsService } from '../chats/chats.service';
import { VectorStoreService } from './vector-store.service';
import { LlmService } from './llm.service';
import {
  renderSources,
  UNTRUSTED_DATA_RULE,
  type PromptSource,
} from './prompts';

const PAST_QUOTATION_LIMIT = 5;
const RECENT_MESSAGE_LIMIT = 40;

const QuotationDraftSchema = z.object({
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
    }),
  ),
  notes: z.string(),
  rationale: z.string(),
  basedOnSourceIds: z.array(z.number()),
});

@Injectable()
export class QuotationDraftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chats: ChatsService,
    private readonly vectors: VectorStoreService,
    private readonly llm: LlmService,
  ) {}

  async draft(
    userId: string,
    role: Role,
    chatId: string,
    instructions?: string,
  ) {
    if (role !== Role.PROFESSIONAL) {
      throw new ForbiddenException('Only professionals can draft quotations');
    }
    const context = await this.chats.getChatContext(userId, role, chatId);
    const professionalId = context.chat.professionalId;

    const [chat, recentMessages] = await Promise.all([
      this.prisma.chat.findUnique({
        where: { id: chatId },
        select: {
          projectRequest: {
            select: {
              title: true,
              description: true,
              budgetMin: true,
              budgetMax: true,
              timeline: true,
            },
          },
        },
      }),
      this.prisma.message.findMany({
        where: { chatId, type: MessageType.TEXT, content: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: RECENT_MESSAGE_LIMIT,
        select: { content: true, senderId: true },
      }),
    ]);

    const request = chat?.projectRequest;
    const conversation = recentMessages
      .reverse()
      .map(
        (message) =>
          `${message.senderId === userId ? 'Professional (you)' : 'Client'}: ${message.content}`,
      )
      .join('\n');

    const scopeText = [
      request && `${request.title}\n${request.description}`,
      conversation.slice(-3000),
      instructions,
    ]
      .filter(Boolean)
      .join('\n');

    // Retrieve this professional's own most similar past quotations — never
    // anyone else's (scope = their professional id).
    const hits = scopeText
      ? await this.vectors.search(scopeText, {
          sourceTypes: [EmbeddingSourceType.QUOTATION],
          scopeIds: [professionalId],
          limit: PAST_QUOTATION_LIMIT,
        })
      : [];
    const pastQuotations = await this.prisma.quotation.findMany({
      where: { id: { in: hits.map((hit) => hit.sourceId) }, professionalId },
      include: {
        items: true,
        projectRequest: { select: { title: true } },
      },
    });
    const ordered = hits
      .map((hit) => pastQuotations.find((q) => q.id === hit.sourceId))
      .filter((q): q is (typeof pastQuotations)[number] => Boolean(q));

    const sources: PromptSource[] = ordered.map((quotation, index) => ({
      n: index + 1,
      label: `Past quotation (${quotation.status.toLowerCase()}, ${quotation.createdAt.toISOString().slice(0, 10)})`,
      text: [
        quotation.projectRequest &&
          `Project: ${quotation.projectRequest.title}`,
        ...quotation.items.map(
          (item) =>
            `- ${item.description} | qty ${Number(item.quantity)} × ${quotation.currency} ${Number(item.unitPrice)} = ${Number(item.total)}`,
        ),
        `Total: ${quotation.currency} ${Number(quotation.totalAmount)}`,
        quotation.notes && `Notes: ${quotation.notes}`,
      ]
        .filter(Boolean)
        .join('\n'),
    }));

    const requestBlock = request
      ? [
          `Title: ${request.title}`,
          `Description: ${request.description}`,
          (request.budgetMin != null || request.budgetMax != null) &&
            `Client budget: ${[request.budgetMin, request.budgetMax]
              .filter((v) => v != null)
              .map((v) => `$${Number(v)}`)
              .join(' – ')}`,
          request.timeline && `Timeline: ${request.timeline}`,
        ]
          .filter(Boolean)
          .join('\n')
      : '(No project request is linked to this chat.)';

    const draft = await this.llm.generateStructured(QuotationDraftSchema, {
      effort: 'medium',
      system: [
        'You draft construction quotations for a professional on Synergi. The professional will review and edit your draft before sending it, so be concrete and realistic.',
        "Base line items on the client's project and what was discussed in the chat. Base pricing on the professional's own past quotations (the numbered sources), favoring accepted ones; scale quantities to this project. If there are no comparable past quotations, still propose reasonable line items but say in the rationale that pricing needs the professional's own estimate.",
        'Rules for items: 2–10 line items, each with a short description (under 120 characters), a positive quantity, and a unit price in USD (0 if genuinely unknown).',
        'notes: a short client-facing note (scope assumptions, exclusions, payment terms if discussed). Under 600 characters.',
        'rationale: a short private explanation for the professional of how you derived the prices, citing sources as [1], [2]. Under 400 characters.',
        'basedOnSourceIds: the numbers of the past-quotation sources you relied on.',
        UNTRUSTED_DATA_RULE,
      ].join('\n'),
      prompt: [
        `<project_request>\n${requestBlock}\n</project_request>`,
        `<source id="chat" label="Recent chat messages">\n${conversation.replace(/<\/?source[^>]*>/gi, '') || '(no messages yet)'}\n</source>`,
        sources.length > 0
          ? renderSources(sources)
          : '(This professional has no past quotations yet.)',
        instructions &&
          `<professional_instructions>\n${instructions}\n</professional_instructions>`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    });

    const items = draft.items
      .map((item) => ({
        description: item.description.trim().slice(0, 255),
        quantity: item.quantity > 0 ? Math.round(item.quantity * 100) / 100 : 1,
        unitPrice:
          item.unitPrice >= 0 ? Math.round(item.unitPrice * 100) / 100 : 0,
      }))
      .filter((item) => item.description.length > 0)
      .slice(0, 20);

    return {
      items,
      notes: draft.notes.trim().slice(0, 2000),
      rationale: draft.rationale.trim(),
      basedOn: [...new Set(draft.basedOnSourceIds)]
        .filter((n) => ordered[n - 1])
        .map((n) => ({ n, quotation: ordered[n - 1] }))
        .map(({ n, quotation }) => ({
          n,
          id: quotation.id,
          status: quotation.status,
          totalAmount: Number(quotation.totalAmount),
          createdAt: quotation.createdAt,
        })),
    };
  }
}
