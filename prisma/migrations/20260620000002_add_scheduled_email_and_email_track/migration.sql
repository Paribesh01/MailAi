-- CreateTable: scheduled_email
CREATE TABLE IF NOT EXISTS "scheduled_email" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "scheduled_email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scheduled_email_userId_status_scheduledAt_idx" ON "scheduled_email"("userId", "status", "scheduledAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "scheduled_email" ADD CONSTRAINT "scheduled_email_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: email_track
CREATE TABLE IF NOT EXISTS "email_track" (
    "id" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "email_track_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "email_track_trackingId_key" ON "email_track"("trackingId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_track_userId_idx" ON "email_track"("userId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "email_track" ADD CONSTRAINT "email_track_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
