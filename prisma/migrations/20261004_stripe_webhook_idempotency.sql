-- Stripe Webhook Idempotency Migration
-- Adds a unique Stripe event id to CreditTransaction so that a replayed or
-- retried webhook delivery cannot grant credits more than once.
--
-- Safe to apply to existing data: the column is nullable, every existing row
-- becomes NULL, and Postgres permits multiple NULLs in a unique index.

ALTER TABLE "CreditTransaction" ADD COLUMN IF NOT EXISTS "stripeEventId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "CreditTransaction_stripeEventId_key"
    ON "CreditTransaction"("stripeEventId");
