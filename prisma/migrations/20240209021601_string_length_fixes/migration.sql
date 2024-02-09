/*
  Warnings:

  - The `agreementNumber` column on the `Employer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `answerOptions` on the `MeetingScriptQuestion` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.
  - You are about to alter the column `skills` on the `Resume` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `description` on the `ResumeCertificate` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `degree` on the `ResumeEducation` table. The data in that column could be lost. The data in that column will be cast from `VarChar(70)` to `VarChar(50)`.
  - You are about to alter the column `logoUrl` on the `University` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `keySkills` on the `Vacancy` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to drop the `passwordResetRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Applicant" ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "login" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "firstName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "middleName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "lastName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "city" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "country" SET DATA TYPE VARCHAR(62);

-- AlterTable
ALTER TABLE "EmailVerification" ALTER COLUMN "role" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Employer" ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "login" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "firstName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "middleName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "lastName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(256),
DROP COLUMN "agreementNumber",
ADD COLUMN     "agreementNumber" SERIAL,
ALTER COLUMN "city" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "website" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "HhToken" ALTER COLUMN "accessToken" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "refreshToken" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Manager" ALTER COLUMN "login" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Meeting" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "roomUrl" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "MeetingFeedback" ALTER COLUMN "text" SET DATA TYPE VARCHAR(1000);

-- AlterTable
ALTER TABLE "MeetingScriptAnswer" ALTER COLUMN "text" SET DATA TYPE VARCHAR(1000);

-- AlterTable
ALTER TABLE "MeetingScriptQuestion" ALTER COLUMN "answerOptions" SET DATA TYPE VARCHAR(300)[];

-- AlterTable
ALTER TABLE "MeetingScriptTemplate" ALTER COLUMN "title" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "PartnershipInquiry" ALTER COLUMN "representativeName" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "companyName" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "contact" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Password" ALTER COLUMN "hash" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Resume" ALTER COLUMN "importedId" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "city" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "skills" SET DATA TYPE VARCHAR(50)[];

-- AlterTable
ALTER TABLE "ResumeCertificate" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "ResumeContact" ALTER COLUMN "value" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "ResumeEducation" ALTER COLUMN "description" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "degree" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "ResumeExperience" ALTER COLUMN "company" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "SoftArchive" ALTER COLUMN "modelName" SET DATA TYPE VARCHAR(127);

-- AlterTable
ALTER TABLE "University" ALTER COLUMN "logoUrl" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Vacancy" ALTER COLUMN "city" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "keySkills" SET DATA TYPE VARCHAR(50)[],
ALTER COLUMN "shortDescription" SET DATA TYPE VARCHAR(255);

-- DropTable
DROP TABLE "passwordResetRequest";

-- CreateTable
CREATE TABLE "PasswordResetRequest" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "role" VARCHAR(30) NOT NULL,

    CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetRequest_email_key" ON "PasswordResetRequest"("email");
