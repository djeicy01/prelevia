-- AlterTable: add actif column to Assurance
ALTER TABLE "Assurance" ADD COLUMN "actif" BOOLEAN NOT NULL DEFAULT true;
