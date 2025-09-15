/*
  Warnings:

  - You are about to drop the column `acquired` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Process` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Process` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Process" DROP COLUMN "acquired",
DROP COLUMN "createdBy",
DROP COLUMN "updatedAt";
