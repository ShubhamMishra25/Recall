-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('article', 'note', 'pdf', 'voice', 'image');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('owner', 'editor', 'commenter', 'viewer');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('manual', 'ai_generated');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "atoms" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content_text" TEXT NOT NULL,
    "content_html" TEXT,
    "source_url" TEXT,
    "source_type" "SourceType" NOT NULL DEFAULT 'article',
    "flashcard_front" TEXT,
    "flashcard_back" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atom_tags" (
    "atom_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "atom_tags_pkey" PRIMARY KEY ("atom_id","tag_id")
);

-- CreateTable
CREATE TABLE "review_states" (
    "atom_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "elapsed_days" INTEGER NOT NULL DEFAULT 0,
    "scheduled_for" DATE,
    "last_reviewed" TIMESTAMP(3),
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "review_states_pkey" PRIMARY KEY ("atom_id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_atoms" (
    "collection_id" UUID NOT NULL,
    "atom_id" UUID NOT NULL,
    "added_by" UUID NOT NULL,

    CONSTRAINT "collection_atoms_pkey" PRIMARY KEY ("collection_id","atom_id")
);

-- CreateTable
CREATE TABLE "collection_members" (
    "collection_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'viewer',

    CONSTRAINT "collection_members_pkey" PRIMARY KEY ("collection_id","user_id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" UUID NOT NULL,
    "source_atom_id" UUID NOT NULL,
    "target_atom_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "link_type" "LinkType" NOT NULL DEFAULT 'manual',

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "device_info" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "atoms_user_id_idx" ON "atoms"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_user_id_name_key" ON "tags"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "links_source_atom_id_target_atom_id_key" ON "links"("source_atom_id", "target_atom_id");

-- AddForeignKey
ALTER TABLE "atoms" ADD CONSTRAINT "atoms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atom_tags" ADD CONSTRAINT "atom_tags_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "atoms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atom_tags" ADD CONSTRAINT "atom_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_states" ADD CONSTRAINT "review_states_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "atoms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_states" ADD CONSTRAINT "review_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_atoms" ADD CONSTRAINT "collection_atoms_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_atoms" ADD CONSTRAINT "collection_atoms_atom_id_fkey" FOREIGN KEY ("atom_id") REFERENCES "atoms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_atoms" ADD CONSTRAINT "collection_atoms_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_members" ADD CONSTRAINT "collection_members_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_members" ADD CONSTRAINT "collection_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_source_atom_id_fkey" FOREIGN KEY ("source_atom_id") REFERENCES "atoms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_target_atom_id_fkey" FOREIGN KEY ("target_atom_id") REFERENCES "atoms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
