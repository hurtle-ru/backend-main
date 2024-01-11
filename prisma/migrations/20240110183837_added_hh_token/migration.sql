-- CreateTable
CREATE TABLE "HhToken" (
    "applicantId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "HhToken_applicantId_key" ON "HhToken"("applicantId");

-- AddForeignKey
ALTER TABLE "HhToken" ADD CONSTRAINT "HhToken_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
