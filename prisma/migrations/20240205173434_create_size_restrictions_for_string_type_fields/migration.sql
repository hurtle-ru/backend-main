/*
  Warnings:

  - You are about to alter the column `email` on the `Applicant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `login` on the `Applicant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `contact` on the `Applicant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(36)`.
  - You are about to alter the column `firstName` on the `Applicant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `middleName` on the `Applicant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `lastName` on the `Applicant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `phone` on the `Applicant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `city` on the `Applicant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `country` on the `Applicant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `aboutMe` on the `Applicant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3000)`.
  - You are about to alter the column `specialty` on the `Applicant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `nickname` on the `Applicant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - The primary key for the `EmailVerification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `role` on the `EmailVerification` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `code` on the `EmailVerification` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(6)`.
  - You are about to alter the column `userId` on the `EmailVerification` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(36)`.
  - You are about to alter the column `email` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `phone` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `login` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `firstName` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `middleName` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `lastName` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `name` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `inn` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(12)`.
  - You are about to alter the column `ogrn` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `contact` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `agreementNumber` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `city` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `description` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(1000)`.
  - You are about to alter the column `website` on the `Employer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `accessToken` on the `HhToken` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.
  - You are about to alter the column `refreshToken` on the `HhToken` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.
  - You are about to alter the column `login` on the `Manager` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `name` on the `Manager` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `name` on the `Meeting` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `description` on the `Meeting` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(1000)`.
  - You are about to alter the column `roomUrl` on the `Meeting` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `name` on the `MeetingFeedback` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `text` on the `MeetingFeedback` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.
  - You are about to alter the column `text` on the `MeetingScriptAnswer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.
  - You are about to alter the column `text` on the `MeetingScriptQuestion` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.
  - You are about to alter the column `title` on the `MeetingScriptTemplate` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `description` on the `MeetingScriptTemplate` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.
  - You are about to alter the column `message` on the `Offer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `representativeName` on the `PartnershipInquiry` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `companyName` on the `PartnershipInquiry` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `contact` on the `PartnershipInquiry` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `email` on the `PartnershipInquiry` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `hash` on the `Password` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(60)`.
  - You are about to alter the column `importedId` on the `Resume` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(38)`.
  - You are about to alter the column `title` on the `Resume` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `summary` on the `Resume` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3000)`.
  - You are about to alter the column `city` on the `Resume` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `name` on the `ResumeCertificate` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `name` on the `ResumeContact` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `value` on the `ResumeContact` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `name` on the `ResumeEducation` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `description` on the `ResumeEducation` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(250)`.
  - You are about to alter the column `degree` on the `ResumeEducation` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(70)`.
  - You are about to alter the column `company` on the `ResumeExperience` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `position` on the `ResumeExperience` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `description` on the `ResumeExperience` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3000)`.
  - You are about to alter the column `name` on the `ResumeLanguage` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `modelName` on the `SoftArchive` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(30)`.
  - You are about to alter the column `name` on the `University` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(300)`.
  - You are about to alter the column `shortName` on the `University` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `name` on the `Vacancy` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `description` on the `Vacancy` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3000)`.
  - You are about to alter the column `city` on the `Vacancy` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `shortDescription` on the `Vacancy` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `email` on the `passwordResetRequest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `role` on the `passwordResetRequest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `code` on the `passwordResetRequest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(6)`.

*/
-- AlterTable
ALTER TABLE "Applicant" ALTER COLUMN "email" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "login" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "contact" SET DATA TYPE VARCHAR(36),
ALTER COLUMN "firstName" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "middleName" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "lastName" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "city" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "country" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "aboutMe" SET DATA TYPE VARCHAR(3000),
ALTER COLUMN "specialty" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "nickname" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "EmailVerification" DROP CONSTRAINT "EmailVerification_pkey",
ALTER COLUMN "role" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "code" SET DATA TYPE VARCHAR(6),
ALTER COLUMN "userId" SET DATA TYPE VARCHAR(36),
ADD CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("code");

-- AlterTable
ALTER TABLE "Employer" ALTER COLUMN "email" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "login" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "firstName" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "middleName" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "lastName" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "inn" SET DATA TYPE VARCHAR(12),
ALTER COLUMN "ogrn" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "contact" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "agreementNumber" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "city" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(2999),
ALTER COLUMN "website" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "HhToken" ALTER COLUMN "accessToken" SET DATA TYPE VARCHAR(64),
ALTER COLUMN "refreshToken" SET DATA TYPE VARCHAR(64);

-- AlterTable
ALTER TABLE "Manager" ALTER COLUMN "login" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "Meeting" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(1000),
ALTER COLUMN "roomUrl" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "MeetingFeedback" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "text" SET DATA TYPE VARCHAR(300);

-- AlterTable
ALTER TABLE "MeetingScriptAnswer" ALTER COLUMN "text" SET DATA TYPE VARCHAR(300);

-- AlterTable
ALTER TABLE "MeetingScriptQuestion" ALTER COLUMN "text" SET DATA TYPE VARCHAR(300);

-- AlterTable
ALTER TABLE "MeetingScriptTemplate" ALTER COLUMN "title" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(300);

-- AlterTable
ALTER TABLE "Offer" ALTER COLUMN "message" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "PartnershipInquiry" ALTER COLUMN "representativeName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "companyName" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "contact" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "Password" ALTER COLUMN "hash" SET DATA TYPE VARCHAR(60);

-- AlterTable
ALTER TABLE "Resume" ALTER COLUMN "importedId" SET DATA TYPE VARCHAR(38),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "summary" SET DATA TYPE VARCHAR(3000),
ALTER COLUMN "city" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "ResumeCertificate" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "ResumeContact" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "value" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "ResumeEducation" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(250),
ALTER COLUMN "degree" SET DATA TYPE VARCHAR(70);

-- AlterTable
ALTER TABLE "ResumeExperience" ALTER COLUMN "company" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "position" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(3000);

-- AlterTable
ALTER TABLE "ResumeLanguage" ALTER COLUMN "name" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "SoftArchive" ALTER COLUMN "modelName" SET DATA TYPE VARCHAR(30);

-- AlterTable
ALTER TABLE "University" ALTER COLUMN "name" SET DATA TYPE VARCHAR(300),
ALTER COLUMN "shortName" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "Vacancy" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(3000),
ALTER COLUMN "city" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "shortDescription" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "passwordResetRequest" ALTER COLUMN "email" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "role" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "code" SET DATA TYPE VARCHAR(6);
