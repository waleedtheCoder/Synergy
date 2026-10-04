import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { Role } from '../../../generated/prisma';
import { LlmService } from './llm.service';
import { RagIndexService } from './rag-index.service';
import { VectorStoreService } from './vector-store.service';
import { MatchingService } from './matching.service';
import { ProfileQaService } from './profile-qa.service';
import { QuotationDraftService } from './quotation-draft.service';
import { ChatAssistantService } from './chat-assistant.service';
import { ModerationAssistantService } from './moderation-assistant.service';
import { HelpAssistantService } from './help-assistant.service';
import { AskQuestionDto } from './dto/ask-question.dto';
import { AskChatDto } from './dto/ask-chat.dto';
import { DraftQuotationDto } from './dto/draft-quotation.dto';

// Every generation endpoint calls a paid API, so they're rate-limited well
// below the global default. Public ones are tighter still (per IP).
const PUBLIC_AI_THROTTLE = { default: { limit: 5, ttl: 60_000 } };
const USER_AI_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('ai')
@UseInterceptors(TransformInterceptor)
@Controller('ai')
export class AiController {
  constructor(
    private readonly llm: LlmService,
    private readonly ragIndex: RagIndexService,
    private readonly vectors: VectorStoreService,
    private readonly matching: MatchingService,
    private readonly profileQa: ProfileQaService,
    private readonly quotationDraft: QuotationDraftService,
    private readonly chatAssistant: ChatAssistantService,
    private readonly moderation: ModerationAssistantService,
    private readonly help: HelpAssistantService,
  ) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Whether AI answer generation is configured' })
  status() {
    return { enabled: this.llm.isEnabled() };
  }

  @Public()
  @Post('help/ask')
  @HttpCode(HttpStatus.OK)
  @Throttle(PUBLIC_AI_THROTTLE)
  @ApiOperation({ summary: 'Ask the help assistant how Synergi works' })
  askHelp(@Body() dto: AskQuestionDto) {
    return this.help.ask(dto.question);
  }

  @Public()
  @Post('professionals/:id/ask')
  @HttpCode(HttpStatus.OK)
  @Throttle(PUBLIC_AI_THROTTLE)
  @ApiOperation({
    summary: "Ask a question answered from a professional's public profile",
  })
  askAboutProfessional(@Param('id') id: string, @Body() dto: AskQuestionDto) {
    return this.profileQa.ask(id, dto.question);
  }

  @Get('project-requests/:id/matches')
  @Roles(Role.CLIENT)
  @Throttle(USER_AI_THROTTLE)
  @ApiOperation({
    summary: 'Recommend professionals for one of my project requests',
  })
  matchProfessionals(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.matching.matchProfessionals(userId, id);
  }

  @Post('chats/:id/ask')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.CLIENT, Role.PROFESSIONAL)
  @Throttle(USER_AI_THROTTLE)
  @ApiOperation({
    summary: 'Summarize or ask a question about one of my chats',
  })
  askAboutChat(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AskChatDto,
  ) {
    return this.chatAssistant.ask(user.id, user.role, id, dto.question);
  }

  @Post('chats/:id/quotation-draft')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.PROFESSIONAL)
  @Throttle(USER_AI_THROTTLE)
  @ApiOperation({
    summary: 'Draft a quotation from the chat and my past quotations',
  })
  draftQuotation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: DraftQuotationDto,
  ) {
    return this.quotationDraft.draft(user.id, user.role, id, dto.instructions);
  }

  @Get('admin/reports/:id/assessment')
  @Roles(Role.ADMIN)
  @Throttle(USER_AI_THROTTLE)
  @ApiOperation({ summary: 'AI triage suggestion for a report' })
  assessReport(@Param('id') id: string) {
    return this.moderation.assessReport(id);
  }

  @Get('admin/disputes/:id/assessment')
  @Roles(Role.ADMIN)
  @Throttle(USER_AI_THROTTLE)
  @ApiOperation({ summary: 'AI suggestion for handling a dispute' })
  assessDispute(@Param('id') id: string) {
    return this.moderation.assessDispute(id);
  }

  @Get('admin/index')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Embedding counts per source type' })
  indexStats() {
    return this.vectors.countBySourceType();
  }

  @Post('admin/reindex')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rebuild every embedding from source data' })
  reindex() {
    return this.ragIndex.reindexAll();
  }
}
