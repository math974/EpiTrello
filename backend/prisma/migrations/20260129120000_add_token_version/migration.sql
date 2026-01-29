-- Add tokenVersion to invalidate access tokens on logout
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

