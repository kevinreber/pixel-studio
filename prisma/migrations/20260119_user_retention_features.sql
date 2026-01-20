-- User Retention Features Migration
-- This migration adds tables for login streaks, achievements, and user achievements

-- Create LoginStreak table for daily login tracking
CREATE TABLE "LoginStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastLoginDate" TIMESTAMP(3),
    "lastBonusClaimed" TIMESTAMP(3),
    "totalDaysLoggedIn" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginStreak_pkey" PRIMARY KEY ("id")
);

-- Create Achievement definitions table
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'bronze',
    "requirement" INTEGER NOT NULL DEFAULT 1,
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "creditReward" INTEGER NOT NULL DEFAULT 0,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- Create UserAchievement junction table
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint for userId in LoginStreak (one streak per user)
CREATE UNIQUE INDEX "LoginStreak_userId_key" ON "LoginStreak"("userId");

-- Add unique constraint for achievement codes
CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");

-- Add unique constraint for user-achievement pairs
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- Add indexes for query performance
CREATE INDEX "LoginStreak_userId_idx" ON "LoginStreak"("userId");
CREATE INDEX "LoginStreak_lastLoginDate_idx" ON "LoginStreak"("lastLoginDate");
CREATE INDEX "Achievement_category_idx" ON "Achievement"("category");
CREATE INDEX "Achievement_tier_idx" ON "Achievement"("tier");
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- Add foreign key constraints
ALTER TABLE "LoginStreak" ADD CONSTRAINT "LoginStreak_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey"
    FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new notification types to the enum (if using Postgres enum)
-- Note: If NotificationType is stored as TEXT, this step is not needed
-- ALTER TYPE "NotificationType" ADD VALUE 'ACHIEVEMENT_UNLOCKED';
-- ALTER TYPE "NotificationType" ADD VALUE 'STREAK_MILESTONE';
