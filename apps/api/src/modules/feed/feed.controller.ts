import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { FeedService } from './feed.service';
import { QueryFeedDto } from './dto/query-feed.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('feed')
@UseInterceptors(TransformInterceptor)
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse the public project feed' })
  findAll(
    @CurrentUser('id') userId: string | undefined,
    @Query() query: QueryFeedDto,
  ) {
    return this.feedService.findAll(userId, query);
  }

  @Get('bookmarks/me')
  @ApiOperation({ summary: 'List my bookmarked projects' })
  findBookmarked(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.feedService.findBookmarked(userId, query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single feed project' })
  findOne(
    @CurrentUser('id') userId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.feedService.findOne(userId, id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like a project' })
  async like(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.feedService.like(userId, id);
    return null;
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlike a project' })
  async unlike(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.feedService.unlike(userId, id);
    return null;
  }

  @Post(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bookmark a project' })
  async bookmark(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.feedService.bookmark(userId, id);
    return null;
  }

  @Delete(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a bookmark' })
  async unbookmark(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.feedService.unbookmark(userId, id);
    return null;
  }

  @Public()
  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments on a project' })
  findComments(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.feedService.findComments(id, query);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a project' })
  addComment(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.feedService.addComment(userId, id, dto);
  }
}
