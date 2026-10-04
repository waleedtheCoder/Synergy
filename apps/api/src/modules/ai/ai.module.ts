import { Module } from '@nestjs/common';
import { ChatsModule } from '../chats/chats.module';
import { SearchModule } from '../search/search.module';
import { AiController } from './ai.controller';
import { LlmService } from './llm.service';
import { MatchingService } from './matching.service';
import { ProfileQaService } from './profile-qa.service';
import { QuotationDraftService } from './quotation-draft.service';
import { ChatAssistantService } from './chat-assistant.service';
import { ModerationAssistantService } from './moderation-assistant.service';
import { HelpAssistantService } from './help-assistant.service';

@Module({
  imports: [ChatsModule, SearchModule],
  controllers: [AiController],
  providers: [
    LlmService,
    MatchingService,
    ProfileQaService,
    QuotationDraftService,
    ChatAssistantService,
    ModerationAssistantService,
    HelpAssistantService,
  ],
})
export class AiModule {}
