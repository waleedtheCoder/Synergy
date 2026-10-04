import * as path from 'node:path';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  env as transformersEnv,
  pipeline,
  type FeatureExtractionPipeline,
} from '@huggingface/transformers';

// all-MiniLM-L6-v2: small (≈23 MB), fast on CPU, 384-dim sentence vectors.
// Changing the model means changing the vector(384) column and re-embedding
// everything via POST /ai/reindex.
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_DIMENSIONS = 384;

// The model truncates at 256 word-pieces (~1,000 chars of English), so longer
// text is split into overlapping chunks that are embedded separately.
const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 150;

@Injectable()
export class EmbeddingService implements OnApplicationBootstrap {
  private readonly logger = new Logger(EmbeddingService.name);
  private extractor: Promise<FeatureExtractionPipeline> | null = null;

  constructor(private readonly config: ConfigService) {
    transformersEnv.cacheDir = path.join(process.cwd(), '.cache', 'models');
  }

  onApplicationBootstrap(): void {
    // Warm the model in the background so the first real request doesn't pay
    // the load cost (and, on a fresh machine, the one-time download).
    if (this.config.get<string>('NODE_ENV') === 'test') return;
    void this.getExtractor().catch(() => undefined);
  }

  private getExtractor(): Promise<FeatureExtractionPipeline> {
    if (!this.extractor) {
      const startedAt = Date.now();
      this.extractor = pipeline('feature-extraction', EMBEDDING_MODEL, {
        dtype: 'fp32',
      })
        .then((extractor) => {
          this.logger.log(
            `Embedding model ready in ${Date.now() - startedAt}ms`,
          );
          return extractor;
        })
        .catch((error: Error) => {
          this.extractor = null;
          this.logger.error(`Failed to load embedding model: ${error.message}`);
          throw error;
        });
    }
    return this.extractor;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const extractor = await this.getExtractor();
    const output = await extractor(texts, { pooling: 'mean', normalize: true });
    return output.tolist() as number[][];
  }

  async embedOne(text: string): Promise<number[]> {
    const [vector] = await this.embed([text]);
    return vector;
  }

  chunk(text: string): string[] {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= CHUNK_SIZE) return [normalized];

    const chunks: string[] = [];
    let start = 0;
    while (start < normalized.length) {
      let end = Math.min(start + CHUNK_SIZE, normalized.length);
      if (end < normalized.length) {
        // Prefer to break on a sentence or word boundary.
        const window = normalized.slice(start, end);
        const boundary = Math.max(
          window.lastIndexOf('. '),
          window.lastIndexOf('\n'),
        );
        const wordBoundary = window.lastIndexOf(' ');
        if (boundary > CHUNK_SIZE / 2) end = start + boundary + 1;
        else if (wordBoundary > CHUNK_SIZE / 2) end = start + wordBoundary;
      }
      chunks.push(normalized.slice(start, end).trim());
      if (end >= normalized.length) break;
      start = end - CHUNK_OVERLAP;
    }
    return chunks;
  }
}
