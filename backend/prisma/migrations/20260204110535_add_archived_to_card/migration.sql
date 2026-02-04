-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedPosition" INTEGER;
