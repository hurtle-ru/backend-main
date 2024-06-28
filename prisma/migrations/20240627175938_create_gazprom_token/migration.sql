-- CreateTable
CREATE TABLE "GazpromToken" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicantId" TEXT NOT NULL,
    "accessToken" VARCHAR(255) NOT NULL,
    "refreshToken" VARCHAR(255) NOT NULL,
    "tokenType" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GazpromToken_applicantId_key" ON "GazpromToken"("applicantId");

-- AddForeignKey
ALTER TABLE "GazpromToken" ADD CONSTRAINT "GazpromToken_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
