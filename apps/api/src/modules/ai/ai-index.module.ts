import { Global, Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { RagIndexService } from './rag-index.service';

/**
 * Embedding + indexing layer. Global so any feature module's write path can
 * inject RagIndexService to keep the vector index fresh, without importing
 * AiModule (which itself depends on ChatsModule/SearchModule).
 */
@Global()
@Module({
  providers: [EmbeddingService, VectorStoreService, RagIndexService],
  exports: [EmbeddingService, VectorStoreService, RagIndexService],
})
export class AiIndexModule {}
