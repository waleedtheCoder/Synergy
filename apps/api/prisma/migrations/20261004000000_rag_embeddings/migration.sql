-- Enable pgvector (available on Supabase; no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "EmbeddingSourceType" AS ENUM ('PROFESSIONAL_PROFILE', 'SERVICE', 'PORTFOLIO_PROJECT', 'CERTIFICATE', 'REVIEW', 'QUOTATION', 'MESSAGE', 'REPORT', 'DISPUTE', 'HELP_DOC');

-- CreateTable
CREATE TABLE "embeddings" (
    "id" TEXT NOT NULL,
    "source_type" "EmbeddingSourceType" NOT NULL,
    "source_id" TEXT NOT NULL,
    "scope_id" TEXT,
    "content" TEXT NOT NULL,
    "embedding" vector(384) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "embeddings_source_type_source_id_key" ON "embeddings"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "embeddings_source_type_scope_id_idx" ON "embeddings"("source_type", "scope_id");

-- Approximate nearest-neighbour index for cosine distance (<=>).
-- Not expressible in schema.prisma, so it lives only in this migration.
CREATE INDEX "embeddings_embedding_hnsw_idx" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);
