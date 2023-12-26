-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('PHONE', 'EMAIL', 'TELEGRAM', 'VK', 'FACEBOOK', 'LINKEDIN', 'GITHUB', 'OTHER');

-- CreateEnum
CREATE TYPE "LanguageLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'L1');

-- CreateEnum
CREATE TYPE "ResumeImportExternalService" AS ENUM ('HH');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('RUB', 'USD', 'EUR', 'GBP', 'GEL', 'AZN', 'BYR', 'KGS', 'KZT', 'UZS');

-- CreateEnum
CREATE TYPE "EmployerLegalForm" AS ENUM ('INDIVIDUAL_ENTREPRENEUR', 'OOO', 'ZAO', 'PAO', 'NKO');

-- CreateEnum
CREATE TYPE "ManagerAccessLevel" AS ENUM ('NONE');

-- CreateEnum
CREATE TYPE "VacancyExperience" AS ENUM ('NO_EXPERIENCE', 'BETWEEN_1_AND_3', 'BETWEEN_3_AND_6', 'MORE_THAN_6');

-- CreateEnum
CREATE TYPE "VacancyEmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'PROJECT', 'VOLUNTEER', 'PROBATION');

-- CreateEnum
CREATE TYPE "VacancyReportingForm" AS ENUM ('DIRECTOR', 'PROJECT_MANAGER', 'GROUP_WORK', 'INDEPENDENT_WORK');

-- CreateEnum
CREATE TYPE "VacancyTeamRole" AS ENUM ('COLLABORATIVE_WORK', 'TEAM_COORDINATION', 'TEAM_MANAGEMENT', 'INDEPENDENT_WORK');

-- CreateEnum
CREATE TYPE "VacancyWorkingHours" AS ENUM ('STRICT_SCHEDULE', 'FREELANCE', 'GROUP_WORK', 'FIXED_HOURS');

-- CreateEnum
CREATE TYPE "VacancyWorkplaceModel" AS ENUM ('OFFICE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "PartnershipInquiryStatus" AS ENUM ('PENDING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('INTERVIEW', 'CONSULTATION_B2C', 'CONSULTATION_B2B');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PLANNED', 'CANCELED', 'COMPLETED');

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "city" TEXT,
    "country" TEXT,
    "aboutMe" TEXT,
    "specialty" TEXT,
    "nickname" TEXT,
    "isReadyToRelocate" BOOLEAN,
    "isVisibleToEmployers" BOOLEAN NOT NULL DEFAULT false,
    "isConfirmedByManager" BOOLEAN NOT NULL DEFAULT false,
    "level" TEXT,
    "resumeId" TEXT,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "name" TEXT,
    "inn" TEXT,
    "ogrn" TEXT,
    "legalForm" "EmployerLegalForm",
    "isConfirmedByManager" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manager" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accessLevels" "ManagerAccessLevel"[],

    CONSTRAINT "Manager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vacancy" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "teamRole" "VacancyTeamRole" NOT NULL,
    "description" TEXT NOT NULL,
    "salary" INTEGER NOT NULL,
    "salaryCurrency" "Currency" NOT NULL,
    "experience" "VacancyExperience" NOT NULL,
    "employmentType" "VacancyEmploymentType" NOT NULL,
    "price" INTEGER,
    "city" TEXT NOT NULL,
    "reportingForm" "VacancyReportingForm" NOT NULL,
    "workingHours" "VacancyWorkingHours" NOT NULL,
    "workplaceModel" "VacancyWorkplaceModel" NOT NULL,
    "isConfirmedByManager" BOOLEAN NOT NULL DEFAULT false,
    "keySkills" TEXT[],
    "employerId" TEXT NOT NULL,

    CONSTRAINT "Vacancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedFrom" "ResumeImportExternalService",
    "importedId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "city" TEXT,
    "skills" TEXT[],
    "isVisibleToEmployers" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeContact" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" "ContactType" NOT NULL,
    "value" TEXT NOT NULL,
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "resumeId" TEXT NOT NULL,

    CONSTRAINT "ResumeContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeLanguage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "LanguageLevel" NOT NULL,
    "resumeId" TEXT NOT NULL,

    CONSTRAINT "ResumeLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeEducation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "degree" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER NOT NULL,
    "resumeId" TEXT NOT NULL,

    CONSTRAINT "ResumeEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeExperience" (
    "id" TEXT NOT NULL,
    "company" TEXT,
    "position" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "resumeId" TEXT NOT NULL,

    CONSTRAINT "ResumeExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeCertificate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "year" INTEGER,
    "resumeId" TEXT NOT NULL,

    CONSTRAINT "ResumeCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conferenceLink" TEXT NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'PLANNED',
    "applicantId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingSlot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "types" "MeetingType"[],
    "managerId" TEXT NOT NULL,

    CONSTRAINT "MeetingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingScriptProtocol" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "meetingId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "MeetingScriptProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingScriptTemplate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "MeetingScriptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingScriptQuestion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "text" TEXT NOT NULL,
    "answerOptions" TEXT[],

    CONSTRAINT "MeetingScriptQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingScriptAnswer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "text" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "MeetingScriptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingFeedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,

    CONSTRAINT "MeetingFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipInquiry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "representativeName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "PartnershipInquiryStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "PartnershipInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ApplicantToVacancy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_MeetingScriptQuestionToMeetingScriptTemplate" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_email_key" ON "Applicant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_login_key" ON "Applicant"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_phone_key" ON "Applicant"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_nickname_key" ON "Applicant"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_resumeId_key" ON "Applicant"("resumeId");

-- CreateIndex
CREATE UNIQUE INDEX "Employer_email_key" ON "Employer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employer_phone_key" ON "Employer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Employer_login_key" ON "Employer"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_login_key" ON "Manager"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_slotId_key" ON "Meeting"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "_ApplicantToVacancy_AB_unique" ON "_ApplicantToVacancy"("A", "B");

-- CreateIndex
CREATE INDEX "_ApplicantToVacancy_B_index" ON "_ApplicantToVacancy"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MeetingScriptQuestionToMeetingScriptTemplate_AB_unique" ON "_MeetingScriptQuestionToMeetingScriptTemplate"("A", "B");

-- CreateIndex
CREATE INDEX "_MeetingScriptQuestionToMeetingScriptTemplate_B_index" ON "_MeetingScriptQuestionToMeetingScriptTemplate"("B");

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vacancy" ADD CONSTRAINT "Vacancy_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeContact" ADD CONSTRAINT "ResumeContact_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeLanguage" ADD CONSTRAINT "ResumeLanguage_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeEducation" ADD CONSTRAINT "ResumeEducation_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeExperience" ADD CONSTRAINT "ResumeExperience_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeCertificate" ADD CONSTRAINT "ResumeCertificate_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "MeetingSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingSlot" ADD CONSTRAINT "MeetingSlot_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingScriptProtocol" ADD CONSTRAINT "MeetingScriptProtocol_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingScriptProtocol" ADD CONSTRAINT "MeetingScriptProtocol_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MeetingScriptTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingScriptAnswer" ADD CONSTRAINT "MeetingScriptAnswer_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "MeetingScriptProtocol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingScriptAnswer" ADD CONSTRAINT "MeetingScriptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MeetingScriptQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingFeedback" ADD CONSTRAINT "MeetingFeedback_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApplicantToVacancy" ADD CONSTRAINT "_ApplicantToVacancy_A_fkey" FOREIGN KEY ("A") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApplicantToVacancy" ADD CONSTRAINT "_ApplicantToVacancy_B_fkey" FOREIGN KEY ("B") REFERENCES "Vacancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingScriptQuestionToMeetingScriptTemplate" ADD CONSTRAINT "_MeetingScriptQuestionToMeetingScriptTemplate_A_fkey" FOREIGN KEY ("A") REFERENCES "MeetingScriptQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingScriptQuestionToMeetingScriptTemplate" ADD CONSTRAINT "_MeetingScriptQuestionToMeetingScriptTemplate_B_fkey" FOREIGN KEY ("B") REFERENCES "MeetingScriptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
