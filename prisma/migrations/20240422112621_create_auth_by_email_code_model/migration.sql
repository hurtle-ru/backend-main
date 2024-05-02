-- CreateTable
CREATE TABLE "AuthByEmailCode" (
    "code" VARCHAR(6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "role" VARCHAR(30) NOT NULL,

    CONSTRAINT "AuthByEmailCode_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthByEmailCode_userId_role_key" ON "AuthByEmailCode"("userId", "role");
