-- AlterTable
ALTER TABLE "Resume" ALTER COLUMN "importedId" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "summary" SET DATA TYPE VARCHAR(5000),
ALTER COLUMN "skills" SET DATA TYPE VARCHAR(5000)[];
