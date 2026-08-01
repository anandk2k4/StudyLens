-- CreateTable
CREATE TABLE "tutor_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tutor_messages_session_id_idx" ON "tutor_messages"("session_id");

-- CreateIndex
CREATE INDEX "tutor_messages_session_id_created_at_idx" ON "tutor_messages"("session_id", "created_at");

-- AddForeignKey
ALTER TABLE "tutor_messages" ADD CONSTRAINT "tutor_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
