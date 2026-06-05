-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "lastRecoverySentAt" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "recoveryEmail1SentAt" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "recoveryEmail2SentAt" DATETIME;
ALTER TABLE "Lead" ADD COLUMN "recoveryEmail3SentAt" DATETIME;
