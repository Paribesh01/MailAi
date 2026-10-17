-- Track Gmail historyId so sync can skip unchanged threads
ALTER TABLE "thread" ADD COLUMN IF NOT EXISTS "historyId" TEXT;
