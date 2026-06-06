-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SessionStatus" ADD VALUE 'DOWNLOADING';
ALTER TYPE "SessionStatus" ADD VALUE 'EXTRACTING_AUDIO';
ALTER TYPE "SessionStatus" ADD VALUE 'TRANSCRIBING';
ALTER TYPE "SessionStatus" ADD VALUE 'GENERATING_EMBEDDINGS';
ALTER TYPE "SessionStatus" ADD VALUE 'GENERATING_SUMMARY';
ALTER TYPE "SessionStatus" ADD VALUE 'GENERATING_NOTES';
ALTER TYPE "SessionStatus" ADD VALUE 'GENERATING_QUIZ';
ALTER TYPE "SessionStatus" ADD VALUE 'GENERATING_FLASHCARDS';

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "error_message" TEXT;

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");
