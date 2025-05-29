/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `docMetadata` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `documentType` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Document` table. All the data in the column will be lost.
  - Added the required column `document_type` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_path` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "createdAt",
DROP COLUMN "docMetadata",
DROP COLUMN "documentType",
DROP COLUMN "filePath",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "doc_metadata" JSONB,
ADD COLUMN     "document_type" VARCHAR(50) NOT NULL,
ADD COLUMN     "file_path" VARCHAR(255) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
