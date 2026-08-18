import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatGateway } from './chats.gateway';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ChatsController],
  providers: [ChatsService, ChatGateway],
  exports: [ChatsService, ChatGateway],
})
export class ChatsModule {}
