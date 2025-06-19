/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Tool` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Tool` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tool" DROP COLUMN "createdBy",
DROP COLUMN "updatedAt";
