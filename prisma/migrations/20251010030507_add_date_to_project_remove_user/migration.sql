/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "date" TIMESTAMP(3);

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "Role";
