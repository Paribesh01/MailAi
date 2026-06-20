-- Add isReplyLater flag to thread
ALTER TABLE "thread" ADD COLUMN IF NOT EXISTS "isReplyLater" BOOLEAN NOT NULL DEFAULT false;

-- Create vip_contact table
CREATE TABLE IF NOT EXISTS "vip_contact" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "vip_contact_pkey" PRIMARY KEY ("id")
);

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS "vip_contact_userId_email_key" ON "vip_contact"("userId", "email");

-- Create index
CREATE INDEX IF NOT EXISTS "vip_contact_userId_idx" ON "vip_contact"("userId");

-- Add foreign key
ALTER TABLE "vip_contact"
    ADD CONSTRAINT "vip_contact_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
