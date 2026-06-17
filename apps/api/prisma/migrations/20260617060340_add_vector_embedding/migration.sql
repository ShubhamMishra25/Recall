-- This is an empty migration.
-- Enable extension if not already available
CREATE EXTENSION IF NOT EXISTS vector;

-- Add the embedding column (1536-dim for OpenAI text-embedding-3-small)
ALTER TABLE atoms ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create an HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS atoms_embedding_idx ON atoms USING hnsw (embedding vector_cosine_ops);