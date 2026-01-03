/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,nodeId]` on the table `knowledge_nodes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sessionId,name,type]` on the table `memory_entities` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "conversation_summaries" ADD COLUMN     "entities" JSONB,
ADD COLUMN     "keyTopics" TEXT,
ADD COLUMN     "messageCount" INTEGER;

-- AlterTable
ALTER TABLE "knowledge_nodes" ADD COLUMN     "name" TEXT,
ADD COLUMN     "properties" JSONB;

-- AlterTable
ALTER TABLE "knowledge_relationships" ADD COLUMN     "context" TEXT,
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "timestamp" TIMESTAMP(3),
ADD COLUMN     "type" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_nodes_sessionId_nodeId_key" ON "knowledge_nodes"("sessionId", "nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "memory_entities_sessionId_name_type_key" ON "memory_entities"("sessionId", "name", "type");
