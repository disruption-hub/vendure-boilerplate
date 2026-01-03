-- CreateExtension (optional - only if available)
DO $$
BEGIN
CREATE EXTENSION IF NOT EXISTS "vector" WITH VERSION "0.8.1";
EXCEPTION
  WHEN OTHERS THEN
    -- Extension not available, skip it
    RAISE NOTICE 'Vector extension not available, skipping. Error: %', SQLERRM;
END
$$;

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('brand', 'company', 'class', 'country', 'year');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('brand', 'company', 'concept', 'relationship');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "source" TEXT,
    "chunkIndex" INTEGER,
    "totalChunks" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable (only if vector extension is available)
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS "Embedding" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "vector" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);
EXCEPTION
  WHEN undefined_object THEN
    -- Vector type not available, skip this table
    RAISE NOTICE 'Vector type not available, skipping Embedding table';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating Embedding table: %', SQLERRM;
END
$$;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "title" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorySession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemorySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BufferMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BufferMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationSummary" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyTopics" TEXT[],
    "entities" TEXT[],
    "userInterests" TEXT[],
    "pendingActions" TEXT[],
    "messageCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryEntity" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "context" TEXT NOT NULL,
    "lastMentioned" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeNode" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "type" "NodeType" NOT NULL,
    "name" TEXT NOT NULL,
    "properties" JSONB,

    CONSTRAINT "KnowledgeNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRelationship" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "context" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_source_idx" ON "Document"("source");

-- CreateIndex
CREATE INDEX "Document_chunkIndex_idx" ON "Document"("chunkIndex");

-- CreateIndex (only if Embedding table exists)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS "Embedding_documentId_idx" ON "Embedding"("documentId");
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Embedding table does not exist, skipping index';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating Embedding index: %', SQLERRM;
END
$$;

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Conversation_sessionId_idx" ON "Conversation"("sessionId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_timestamp_idx" ON "Message"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MemorySession_sessionId_key" ON "MemorySession"("sessionId");

-- CreateIndex
CREATE INDEX "MemorySession_sessionId_idx" ON "MemorySession"("sessionId");

-- CreateIndex
CREATE INDEX "MemorySession_userId_idx" ON "MemorySession"("userId");

-- CreateIndex
CREATE INDEX "BufferMessage_sessionId_idx" ON "BufferMessage"("sessionId");

-- CreateIndex
CREATE INDEX "BufferMessage_timestamp_idx" ON "BufferMessage"("timestamp");

-- CreateIndex
CREATE INDEX "ConversationSummary_sessionId_idx" ON "ConversationSummary"("sessionId");

-- CreateIndex
CREATE INDEX "ConversationSummary_createdAt_idx" ON "ConversationSummary"("createdAt");

-- CreateIndex
CREATE INDEX "MemoryEntity_sessionId_idx" ON "MemoryEntity"("sessionId");

-- CreateIndex
CREATE INDEX "MemoryEntity_type_idx" ON "MemoryEntity"("type");

-- CreateIndex
CREATE INDEX "MemoryEntity_lastMentioned_idx" ON "MemoryEntity"("lastMentioned");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryEntity_sessionId_name_type_key" ON "MemoryEntity"("sessionId", "name", "type");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeNode_nodeId_key" ON "KnowledgeNode"("nodeId");

-- CreateIndex
CREATE INDEX "KnowledgeNode_sessionId_idx" ON "KnowledgeNode"("sessionId");

-- CreateIndex
CREATE INDEX "KnowledgeNode_type_idx" ON "KnowledgeNode"("type");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeNode_sessionId_nodeId_key" ON "KnowledgeNode"("sessionId", "nodeId");

-- CreateIndex
CREATE INDEX "KnowledgeRelationship_sessionId_idx" ON "KnowledgeRelationship"("sessionId");

-- CreateIndex
CREATE INDEX "KnowledgeRelationship_sourceId_idx" ON "KnowledgeRelationship"("sourceId");

-- CreateIndex
CREATE INDEX "KnowledgeRelationship_targetId_idx" ON "KnowledgeRelationship"("targetId");

-- CreateIndex
CREATE INDEX "KnowledgeRelationship_type_idx" ON "KnowledgeRelationship"("type");

-- CreateIndex
CREATE INDEX "KnowledgeRelationship_timestamp_idx" ON "KnowledgeRelationship"("timestamp");

-- AddForeignKey (only if Embedding table exists)
DO $$
BEGIN
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Embedding table does not exist, skipping foreign key';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding Embedding foreign key: %', SQLERRM;
END
$$;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BufferMessage" ADD CONSTRAINT "BufferMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MemorySession"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationSummary" ADD CONSTRAINT "ConversationSummary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MemorySession"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryEntity" ADD CONSTRAINT "MemoryEntity_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MemorySession"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeNode" ADD CONSTRAINT "KnowledgeNode_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MemorySession"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRelationship" ADD CONSTRAINT "KnowledgeRelationship_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MemorySession"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRelationship" ADD CONSTRAINT "KnowledgeRelationship_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "KnowledgeNode"("nodeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRelationship" ADD CONSTRAINT "KnowledgeRelationship_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "KnowledgeNode"("nodeId") ON DELETE RESTRICT ON UPDATE CASCADE;
