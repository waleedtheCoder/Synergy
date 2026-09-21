import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, UserStatus } from '../../../generated/prisma';
import type { JwtAccessPayload } from '../auth/types/jwt-payload.type';
import { ChatsService } from './chats.service';
import { JoinChatDto } from './dto/join-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';

interface SocketUser {
  id: string;
  role: Role;
}

type AuthenticatedSocket = Socket<any, any, any, { user?: SocketUser }>;

function chatRoom(chatId: string): string {
  return `chat:${chatId}`;
}

// WebSocket handlers sit outside the HTTP ThrottlerGuard entirely, so
// message:send needs its own limiter — otherwise a script could blast a
// chat room unbounded. Per-user, in-memory sliding window; fine for a
// single-instance deployment, would need a shared store (e.g. Redis) behind
// a load balancer with multiple API instances.
const MESSAGE_RATE_LIMIT = 20;
const MESSAGE_RATE_WINDOW_MS = 10_000;

@WebSocketGateway({ namespace: '/chat', cors: { origin: true } })
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly messageTimestamps = new Map<string, number[]>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly chatsService: ChatsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        throw new Error('Missing token');
      }

      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(
        token,
        {
          secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        },
      );

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (
        !user ||
        user.status === UserStatus.SUSPENDED ||
        user.status === UserStatus.DEACTIVATED
      ) {
        throw new Error('Account is not accessible');
      }

      client.data.user = { id: user.id, role: user.role };
    } catch (error) {
      this.logger.warn(
        `Rejected socket connection: ${(error as Error).message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.data.user) {
      this.messageTimestamps.delete(client.data.user.id);
    }
  }

  private getUser(client: AuthenticatedSocket): SocketUser {
    if (!client.data.user) {
      throw new Error('Socket is not authenticated');
    }
    return client.data.user;
  }

  private assertUnderMessageRateLimit(userId: string): void {
    const now = Date.now();
    const recent = (this.messageTimestamps.get(userId) ?? []).filter(
      (ts) => now - ts < MESSAGE_RATE_WINDOW_MS,
    );
    if (recent.length >= MESSAGE_RATE_LIMIT) {
      throw new WsException('Too many messages — slow down');
    }
    recent.push(now);
    this.messageTimestamps.set(userId, recent);
  }

  @SubscribeMessage('chat:join')
  async onJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: JoinChatDto,
  ) {
    const user = this.getUser(client);
    await this.chatsService.getChatContext(user.id, user.role, dto.chatId);
    await client.join(chatRoom(dto.chatId));
  }

  @SubscribeMessage('chat:leave')
  async onLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: JoinChatDto,
  ) {
    await client.leave(chatRoom(dto.chatId));
  }

  @SubscribeMessage('message:send')
  async onSend(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const user = this.getUser(client);
    this.assertUnderMessageRateLimit(user.id);
    const message = await this.chatsService.createMessage(
      user.id,
      user.role,
      dto.chatId,
      dto.content,
    );
    this.server.to(chatRoom(dto.chatId)).emit('message:new', message);
    return message;
  }

  @SubscribeMessage('message:read')
  async onRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: JoinChatDto,
  ) {
    const user = this.getUser(client);
    await this.chatsService.markRead(user.id, user.role, dto.chatId);
    this.server
      .to(chatRoom(dto.chatId))
      .emit('message:read', { chatId: dto.chatId, userId: user.id });
  }

  broadcast(chatId: string, event: string, payload: unknown) {
    this.server.to(chatRoom(chatId)).emit(event, payload);
  }
}
