import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EmbeddingSourceType,
  MessageType,
  type Prisma,
  type Role,
} from '../../../generated/prisma';
import { ChatsService } from '../chats/chats.service';
import { VectorStoreService } from './vector-store.service';
import { LlmService } from './llm.service';
import { UNTRUSTED_DATA_RULE } from './prompts';

// Below this, the whole conversation fits comfortably in one prompt and
// retrieval would only lose context. Above it, retrieve relevant messages
// plus the most recent ones.
const FULL_HISTORY_LIMIT = 150;
const RETRIEVED_LIMIT = 30;
const RECENT_LIMIT = 30;

const SUMMARY_QUESTION =
  'Summarize this conversation: what the project is, what has been agreed (scope, price, dates), any quotations or meetings and their status, and any open questions or next steps.';

const MESSAGE_SELECT = {
  id: true,
  type: true,
  content: true,
  createdAt: true,
  sender: { select: { firstName: true, role: true } },
  quotation: {
    select: {
      status: true,
      totalAmount: true,
      currency: true,
      validUntil: true,
      items: { select: { description: true } },
    },
  },
  meeting: {
    select: {
      scheduledAt: true,
      durationMins: true,
      status: true,
      location: true,
    },
  },
} as const;

@Injectable()
export class ChatAssistantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chats: ChatsService,
    private readonly vectors: VectorStoreService,
    private readonly llm: LlmService,
  ) {}

  async ask(userId: string, role: Role, chatId: string, question?: string) {
    const context = await this.chats.getChatContext(userId, role, chatId);
    const effectiveQuestion = question?.trim() || SUMMARY_QUESTION;

    const total = await this.prisma.message.count({ where: { chatId } });

    let messages: Prisma.MessageGetPayload<{
      select: typeof MESSAGE_SELECT;
    }>[];
    let partial = false;
    if (total <= FULL_HISTORY_LIMIT) {
      messages = await this.prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'asc' },
        select: MESSAGE_SELECT,
      });
    } else {
      partial = true;
      const [retrieved, recent] = await Promise.all([
        this.vectors.search(effectiveQuestion, {
          sourceTypes: [EmbeddingSourceType.MESSAGE],
          scopeIds: [chatId],
          limit: RETRIEVED_LIMIT,
        }),
        this.prisma.message.findMany({
          where: { chatId },
          orderBy: { createdAt: 'desc' },
          take: RECENT_LIMIT,
          select: { id: true },
        }),
      ]);
      // Quotations and meetings are few and always relevant to "what was
      // agreed", so they're always included alongside retrieved text.
      const structured = await this.prisma.message.findMany({
        where: {
          chatId,
          type: { in: [MessageType.QUOTATION, MessageType.MEETING] },
        },
        select: { id: true },
      });
      const ids = new Set([
        ...retrieved.map((hit) => hit.sourceId),
        ...recent.map((message) => message.id),
        ...structured.map((message) => message.id),
      ]);
      messages = await this.prisma.message.findMany({
        where: { id: { in: [...ids] }, chatId },
        orderBy: { createdAt: 'asc' },
        select: MESSAGE_SELECT,
      });
    }

    const transcript = messages
      .map((message) => {
        const who = `${message.sender.role === 'CLIENT' ? 'Client' : 'Professional'} ${message.sender.firstName}`;
        const when = message.createdAt
          .toISOString()
          .slice(0, 16)
          .replace('T', ' ');
        let body = message.content ?? '';
        if (message.quotation) {
          const q = message.quotation;
          body = `[Quotation, status ${q.status}: ${q.currency} ${Number(q.totalAmount)} for ${q.items.map((item) => item.description).join('; ')}${q.validUntil ? `, valid until ${q.validUntil.toISOString().slice(0, 10)}` : ''}]`;
        } else if (message.meeting) {
          const m = message.meeting;
          body = `[Meeting at ${m.scheduledAt.toISOString().slice(0, 16).replace('T', ' ')} UTC for ${m.durationMins} min${m.location ? ` at ${m.location}` : ''}, status ${m.status}]`;
        } else if (
          message.type === MessageType.IMAGE ||
          message.type === MessageType.PDF
        ) {
          body = `[Shared a ${message.type === MessageType.IMAGE ? 'photo' : 'PDF'}]${body ? ` ${body}` : ''}`;
        }
        return `[${when}] ${who}: ${body}`.replace(/<\/?source[^>]*>/gi, '');
      })
      .join('\n');

    const answer = await this.llm.generateText({
      effort: 'low',
      system: [
        `You help a ${context.isClient ? 'client' : 'professional'} on Synergi, a construction marketplace, make sense of their private chat with the other party.`,
        'Answer only from the chat transcript. If the transcript does not contain the answer, say so — do not guess.',
        'Be concise and concrete: quote amounts, dates and statuses exactly as they appear. Refer to people as "the client" and "the professional" (or by first name).',
        partial
          ? 'The transcript is an excerpt (the most relevant and most recent messages of a long chat), so mention it if the answer might be in messages not shown.'
          : '',
        'Use short paragraphs or a short list; no headings.',
        UNTRUSTED_DATA_RULE,
      ]
        .filter(Boolean)
        .join('\n'),
      prompt: `<source id="chat" label="Chat transcript (times in UTC)">\n${transcript || '(no messages yet)'}\n</source>\n\n<question>\n${effectiveQuestion}\n</question>`,
    });

    return { answer, partial, messageCount: total };
  }
}
