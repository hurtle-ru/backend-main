-- AlterTable
ALTER TABLE "ResumeCertificate" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "ResumeContact" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "ResumeEducation" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "degree" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "ResumeExperience" ALTER COLUMN "position" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "ResumeLanguage" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "level" SET DATA TYPE VARCHAR(100);
