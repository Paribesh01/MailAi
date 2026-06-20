-- Add writingTone to user_preferences
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "writingTone" TEXT;
