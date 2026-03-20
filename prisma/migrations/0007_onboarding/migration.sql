ALTER TABLE "Business" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
-- Set existing businesses as onboarded
UPDATE "Business" SET "onboardingCompletedAt" = NOW() WHERE "onboardingCompletedAt" IS NULL;
