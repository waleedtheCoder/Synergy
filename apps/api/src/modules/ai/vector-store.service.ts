import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, EmbeddingSourceType } from '../../../generated/prisma';
import { EmbeddingService } from './embedding.service';

export interface VectorDocument {
  sourceType: EmbeddingSourceType;
  sourceId: string;
  scopeId: string | null;
  text: string;
}

export interface VectorMatch {
  sourceType: EmbeddingSourceType;
  /** Base source row id, with any "#n" chunk suffix stripped. */
  sourceId: string;
  scopeId: string | null;
  content: string;
  similarity: number;
}

export interface VectorSearchOptions {
  sourceTypes: EmbeddingSourceType[];
  scopeIds?: string[];
  excludeSourceIds?: string[];
  limit: number;
}

function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

function baseSourceId(sourceId: string): string {
  const hashIndex = sourceId.indexOf('#');
  return hashIndex === -1 ? sourceId : sourceId.slice(0, hashIndex);
}

/**
 * Thin raw-SQL layer over the `embeddings` table — Prisma can't read or
 * write the pgvector `vector` column, so every query here is hand-written.
 */
@Injectable()
export class VectorStoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingService,
  ) {}

  /** Replaces every chunk of the given source with freshly embedded text. */
  async upsert(document: VectorDocument): Promise<void> {
    const chunks = this.embeddings.chunk(document.text).filter(Boolean);
    if (chunks.length === 0) {
      await this.remove(document.sourceType, document.sourceId);
      return;
    }

    const vectors = await this.embeddings.embed(chunks);
    const rows = chunks.map(
      (content, index) =>
        Prisma.sql`(${`emb_${document.sourceType}_${document.sourceId}_${index}`}, ${document.sourceType}::"EmbeddingSourceType", ${index === 0 ? document.sourceId : `${document.sourceId}#${index}`}, ${document.scopeId}, ${content}, ${toVectorLiteral(vectors[index])}::vector, now())`,
    );

    await this.prisma.$transaction([
      this.removeQuery(document.sourceType, document.sourceId),
      this.prisma.$executeRaw`
        INSERT INTO embeddings (id, source_type, source_id, scope_id, content, embedding, updated_at)
        VALUES ${Prisma.join(rows)}
      `,
    ]);
  }

  private removeQuery(sourceType: EmbeddingSourceType, sourceId: string) {
    return this.prisma.$executeRaw`
      DELETE FROM embeddings
      WHERE source_type = ${sourceType}::"EmbeddingSourceType"
        AND (source_id = ${sourceId} OR source_id LIKE ${`${sourceId}#%`})
    `;
  }

  async remove(sourceType: EmbeddingSourceType, sourceId: string) {
    await this.removeQuery(sourceType, sourceId);
  }

  async removeAllOfType(sourceType: EmbeddingSourceType): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM embeddings WHERE source_type = ${sourceType}::"EmbeddingSourceType"
    `;
  }

  async search(
    query: string | number[],
    options: VectorSearchOptions,
  ): Promise<VectorMatch[]> {
    if (options.sourceTypes.length === 0) return [];
    if (options.scopeIds && options.scopeIds.length === 0) return [];

    const vector =
      typeof query === 'string' ? await this.embeddings.embedOne(query) : query;
    const literal = toVectorLiteral(vector);

    const conditions: Prisma.Sql[] = [
      Prisma.sql`source_type IN (${Prisma.join(
        options.sourceTypes.map(
          (type) => Prisma.sql`${type}::"EmbeddingSourceType"`,
        ),
      )})`,
    ];
    if (options.scopeIds) {
      conditions.push(
        Prisma.sql`scope_id IN (${Prisma.join(options.scopeIds)})`,
      );
    }
    if (options.excludeSourceIds && options.excludeSourceIds.length > 0) {
      conditions.push(
        Prisma.sql`split_part(source_id, '#', 1) NOT IN (${Prisma.join(options.excludeSourceIds)})`,
      );
    }

    type Row = {
      source_type: EmbeddingSourceType;
      source_id: string;
      scope_id: string | null;
      content: string;
      similarity: number;
    };
    const where = Prisma.join(conditions, ' AND ');

    let rows: Row[];
    if (options.scopeIds) {
      // Scoped searches (one chat, one professional) touch few rows, and the
      // HNSW index filters *after* its candidate scan — it could return
      // nothing for a small scope. The MATERIALIZED CTE forces an exact scan.
      rows = await this.prisma.$queryRaw<Row[]>`
        WITH candidates AS MATERIALIZED (
          SELECT source_type, source_id, scope_id, content, embedding
          FROM embeddings
          WHERE ${where}
        )
        SELECT source_type, source_id, scope_id, content,
               1 - (embedding <=> ${literal}::vector) AS similarity
        FROM candidates
        ORDER BY embedding <=> ${literal}::vector
        LIMIT ${options.limit}
      `;
    } else {
      // Platform-wide searches use the HNSW index; widen its candidate pool
      // (default 40) so the source_type filter still leaves enough rows.
      const [, result] = await this.prisma.$transaction([
        this.prisma.$executeRawUnsafe('SET LOCAL hnsw.ef_search = 1000'),
        this.prisma.$queryRaw<Row[]>`
          SELECT source_type, source_id, scope_id, content,
                 1 - (embedding <=> ${literal}::vector) AS similarity
          FROM embeddings
          WHERE ${where}
          ORDER BY embedding <=> ${literal}::vector
          LIMIT ${options.limit}
        `,
      ]);
      rows = result;
    }

    return rows.map((row) => ({
      sourceType: row.source_type,
      sourceId: baseSourceId(row.source_id),
      scopeId: row.scope_id,
      content: row.content,
      similarity: Number(row.similarity),
    }));
  }

  async countBySourceType(): Promise<Record<string, number>> {
    const rows = await this.prisma.$queryRaw<
      { source_type: string; count: bigint }[]
    >`SELECT source_type, count(*) AS count FROM embeddings GROUP BY source_type`;
    return Object.fromEntries(
      rows.map((row) => [row.source_type, Number(row.count)]),
    );
  }
}
