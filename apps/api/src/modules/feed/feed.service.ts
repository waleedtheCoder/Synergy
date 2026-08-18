import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination-query.dto';
import type { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { QueryFeedDto } from './dto/query-feed.dto';
import type { CreateCommentDto } from './dto/create-comment.dto';

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

const FEED_ITEM_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { order: 'asc' as const } },
  professional: {
    select: {
      id: true,
      slug: true,
      businessName: true,
      verified: true,
      user: { select: { firstName: true, lastName: true, avatarUrl: true } },
    },
  },
} as const;

const COMMENT_INCLUDE = {
  user: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  },
} as const;

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  private async attachViewerFlags<T extends { id: string }>(
    items: T[],
    userId?: string,
  ): Promise<(T & { isLiked: boolean; isBookmarked: boolean })[]> {
    if (!userId || items.length === 0) {
      return items.map((item) => ({
        ...item,
        isLiked: false,
        isBookmarked: false,
      }));
    }

    const ids = items.map((item) => item.id);
    const [likes, bookmarks] = await Promise.all([
      this.prisma.projectLike.findMany({
        where: { userId, portfolioProjectId: { in: ids } },
        select: { portfolioProjectId: true },
      }),
      this.prisma.projectBookmark.findMany({
        where: { userId, portfolioProjectId: { in: ids } },
        select: { portfolioProjectId: true },
      }),
    ]);
    const likedIds = new Set(likes.map((like) => like.portfolioProjectId));
    const bookmarkedIds = new Set(
      bookmarks.map((bookmark) => bookmark.portfolioProjectId),
    );

    return items.map((item) => ({
      ...item,
      isLiked: likedIds.has(item.id),
      isBookmarked: bookmarkedIds.has(item.id),
    }));
  }

  private async assertPublished(id: string): Promise<void> {
    const project = await this.prisma.portfolioProject.findUnique({
      where: { id },
      select: { published: true },
    });
    if (!project || !project.published) {
      throw new NotFoundException('Project not found');
    }
  }

  async findAll(userId: string | undefined, query: QueryFeedDto) {
    const where = {
      published: true,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.portfolioProject.findMany({
        where,
        include: FEED_ITEM_INCLUDE,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.portfolioProject.count({ where }),
    ]);

    return paginate(await this.attachViewerFlags(items, userId), total, query);
  }

  async findOne(userId: string | undefined, id: string) {
    const project = await this.prisma.portfolioProject.findUnique({
      where: { id },
      include: FEED_ITEM_INCLUDE,
    });

    if (!project || !project.published) {
      throw new NotFoundException('Project not found');
    }

    const [withFlags] = await this.attachViewerFlags([project], userId);
    return withFlags;
  }

  async findBookmarked(userId: string, query: PaginationQueryDto) {
    const where = { userId };

    const [bookmarks, total] = await Promise.all([
      this.prisma.projectBookmark.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
        select: { portfolioProject: { include: FEED_ITEM_INCLUDE } },
      }),
      this.prisma.projectBookmark.count({ where }),
    ]);

    const items = bookmarks
      .map((bookmark) => bookmark.portfolioProject)
      .filter((p) => p.published);
    return paginate(await this.attachViewerFlags(items, userId), total, query);
  }

  async like(userId: string, id: string): Promise<void> {
    await this.assertPublished(id);
    try {
      await this.prisma.$transaction([
        this.prisma.projectLike.create({
          data: { userId, portfolioProjectId: id },
        }),
        this.prisma.portfolioProject.update({
          where: { id },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return;
      }
      throw error;
    }
  }

  async unlike(userId: string, id: string): Promise<void> {
    const result = await this.prisma.projectLike.deleteMany({
      where: { userId, portfolioProjectId: id },
    });
    if (result.count > 0) {
      await this.prisma.portfolioProject.update({
        where: { id },
        data: { likesCount: { decrement: 1 } },
      });
    }
  }

  async bookmark(userId: string, id: string): Promise<void> {
    await this.assertPublished(id);
    try {
      await this.prisma.$transaction([
        this.prisma.projectBookmark.create({
          data: { userId, portfolioProjectId: id },
        }),
        this.prisma.portfolioProject.update({
          where: { id },
          data: { bookmarksCount: { increment: 1 } },
        }),
      ]);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return;
      }
      throw error;
    }
  }

  async unbookmark(userId: string, id: string): Promise<void> {
    const result = await this.prisma.projectBookmark.deleteMany({
      where: { userId, portfolioProjectId: id },
    });
    if (result.count > 0) {
      await this.prisma.portfolioProject.update({
        where: { id },
        data: { bookmarksCount: { decrement: 1 } },
      });
    }
  }

  async findComments(id: string, query: PaginationQueryDto) {
    await this.assertPublished(id);
    const where = { portfolioProjectId: id };

    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: COMMENT_INCLUDE,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' as const },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  async addComment(userId: string, id: string, dto: CreateCommentDto) {
    await this.assertPublished(id);
    return this.prisma.comment.create({
      data: { portfolioProjectId: id, userId, content: dto.content },
      include: COMMENT_INCLUDE,
    });
  }
}
