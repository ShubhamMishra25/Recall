/*
  Warnings:

  - The primary key for the `review_states` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `last_reviewed` on the `review_states` table. All the data in the column will be lost.
  - You are about to drop the column `scheduled_for` on the `review_states` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[atom_id,user_id]` on the table `review_states` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `due` to the `review_states` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `review_states` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `scheduled_days` to the `review_states` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `review_states` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `review_states` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "review_states" DROP CONSTRAINT "review_states_pkey",
DROP COLUMN "last_reviewed",
DROP COLUMN "scheduled_for",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "due" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "id" UUID NOT NULL,
ADD COLUMN     "last_review" TIMESTAMP(3),
ADD COLUMN     "scheduled_days" INTEGER NOT NULL,
ADD COLUMN     "state" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "stability" DROP DEFAULT,
ALTER COLUMN "difficulty" DROP DEFAULT,
ALTER COLUMN "elapsed_days" DROP DEFAULT,
ALTER COLUMN "reps" DROP DEFAULT,
ALTER COLUMN "lapses" DROP DEFAULT,
ADD CONSTRAINT "review_states_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "review_logs" (
    "id" UUID NOT NULL,
    "atom_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stability" DOUBLE PRECISION NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL,
    "interval" INTEGER NOT NULL,

    CONSTRAINT "review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_states_atom_id_user_id_key" ON "review_states"("atom_id", "user_id");

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "atoms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
