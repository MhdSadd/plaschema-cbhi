-- AlterTable
ALTER TABLE "CapitationRun" ALTER COLUMN "rate" DROP NOT NULL;
ALTER TABLE "CapitationRun" ADD COLUMN "tiers" JSONB;

-- AlterTable
ALTER TABLE "CapitationRecord" ALTER COLUMN "rate" DROP NOT NULL;
ALTER TABLE "CapitationRecord" ADD COLUMN "tierMin" INTEGER;
ALTER TABLE "CapitationRecord" ADD COLUMN "tierMax" INTEGER;
ALTER TABLE "CapitationRecord" ADD COLUMN "tierAmount" INTEGER;
ALTER TABLE "CapitationRecord" ADD COLUMN "tierLabel" TEXT;
