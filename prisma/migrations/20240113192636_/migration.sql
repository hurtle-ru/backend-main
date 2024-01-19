-- CreateTable
CREATE TABLE "SoftArchieve" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "SoftArchieve_pkey" PRIMARY KEY ("id")
);
