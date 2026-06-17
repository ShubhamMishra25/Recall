/*
  Warnings:

  - You are about to drop the column `embedding` on the `atoms` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "atoms_embedding_idx";

-- AlterTable
ALTER TABLE "atoms" DROP COLUMN "embedding";
