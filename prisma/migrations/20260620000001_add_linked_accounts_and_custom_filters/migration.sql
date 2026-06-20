-- Add accountEmail to thread (tracks which linked account owns a thread; NULL = primary)
ALTER TABLE "thread" ADD COLUMN IF NOT EXISTS "accountEmail" TEXT;

-- ─── linked_account ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "linked_account" (
    "id"           TEXT        NOT NULL,
    "email"        TEXT        NOT NULL,
    "name"         TEXT,
    "image"        TEXT,
    "accessToken"  TEXT        NOT NULL,
    "refreshToken" TEXT,
    "expiresAt"    TIMESTAMP(3),
    "scope"        TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId"       TEXT        NOT NULL,

    CONSTRAINT "linked_account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "linked_account_userId_email_key"
    ON "linked_account"("userId", "email");

CREATE INDEX IF NOT EXISTS "linked_account_userId_idx"
    ON "linked_account"("userId");

DO $$ BEGIN
    ALTER TABLE "linked_account"
        ADD CONSTRAINT "linked_account_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "user"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── custom_filter ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "custom_filter" (
    "id"         TEXT         NOT NULL,
    "name"       TEXT         NOT NULL,
    "color"      TEXT         NOT NULL DEFAULT '#6b7db3',
    "conditions" JSONB        NOT NULL DEFAULT '{}',
    "position"   INTEGER      NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId"     TEXT         NOT NULL,

    CONSTRAINT "custom_filter_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "custom_filter_userId_idx"
    ON "custom_filter"("userId");

DO $$ BEGIN
    ALTER TABLE "custom_filter"
        ADD CONSTRAINT "custom_filter_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "user"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
