-- CreateTable
CREATE TABLE "ApplicantAiChat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicantId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,

    CONSTRAINT "ApplicantAiChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantAiChatMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prompt" VARCHAR(65535) NOT NULL,
    "response" VARCHAR(65535) NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "chatId" TEXT NOT NULL,

    CONSTRAINT "ApplicantAiChatMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ApplicantAiChat" ADD CONSTRAINT "ApplicantAiChat_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantAiChat" ADD CONSTRAINT "ApplicantAiChat_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantAiChatMessage" ADD CONSTRAINT "ApplicantAiChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "ApplicantAiChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
