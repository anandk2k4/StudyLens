-- CreateEnum
CREATE TYPE "KBStatus" AS ENUM ('PENDING', 'BUILDING', 'EXTRACTING', 'EMBEDDING', 'READY', 'ERROR');

-- CreateEnum
CREATE TYPE "FeatureType" AS ENUM ('SUMMARY', 'NOTES', 'QUIZ', 'FLASHCARDS', 'CHAPTERS');

-- CreateEnum
CREATE TYPE "FeatureStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'ERROR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SessionStatus" ADD VALUE 'BUILDING_KNOWLEDGE_BASE';
ALTER TYPE "SessionStatus" ADD VALUE 'KNOWLEDGE_BASE_READY';
ALTER TYPE "SessionStatus" ADD VALUE 'GENERATING_FEATURES';

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "revision" JSONB;

-- CreateTable
CREATE TABLE "knowledge_bases" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "cleanedTranscript" TEXT,
    "status" "KBStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "topics" JSONB,
    "concepts" JSONB,
    "key_facts" JSONB,
    "relationships" JSONB,
    "learning_objectives" JSONB,
    "chapters" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_chunks" (
    "id" TEXT NOT NULL,
    "knowledge_base_id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "start_time" DOUBLE PRECISION NOT NULL,
    "end_time" DOUBLE PRECISION NOT NULL,
    "topic_label" TEXT,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "transcript_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_features" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "feature_type" "FeatureType" NOT NULL,
    "status" "FeatureStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_features_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_bases_session_id_key" ON "knowledge_bases"("session_id");

-- CreateIndex
CREATE INDEX "transcript_chunks_knowledge_base_id_idx" ON "transcript_chunks"("knowledge_base_id");

-- CreateIndex
CREATE INDEX "transcript_chunks_knowledge_base_id_index_idx" ON "transcript_chunks"("knowledge_base_id", "index");

-- CreateIndex
CREATE INDEX "generated_features_session_id_idx" ON "generated_features"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "generated_features_session_id_feature_type_key" ON "generated_features"("session_id", "feature_type");

-- AddForeignKey
ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcript_chunks" ADD CONSTRAINT "transcript_chunks_knowledge_base_id_fkey" FOREIGN KEY ("knowledge_base_id") REFERENCES "knowledge_bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_features" ADD CONSTRAINT "generated_features_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
