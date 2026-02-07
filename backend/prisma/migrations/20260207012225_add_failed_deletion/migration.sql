-- CreateTable
CREATE TABLE "FailedDeletion" (
    "id" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FailedDeletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FailedDeletion_objectKey_key" ON "FailedDeletion"("objectKey");

-- CreateIndex
CREATE INDEX "FailedDeletion_objectKey_idx" ON "FailedDeletion"("objectKey");
