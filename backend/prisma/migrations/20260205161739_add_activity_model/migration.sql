-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('WORKSPACE_CREATED', 'WORKSPACE_UPDATED', 'WORKSPACE_MEMBER_ADDED', 'WORKSPACE_MEMBER_REMOVED', 'WORKSPACE_MEMBER_LEFT', 'BOARD_CREATED', 'BOARD_UPDATED', 'LIST_CREATED', 'LIST_UPDATED', 'LIST_ARCHIVED', 'LIST_REORDERED', 'CARD_CREATED', 'CARD_UPDATED', 'CARD_ARCHIVED', 'CARD_DELETED', 'CARD_MOVED', 'CARD_DUE_DATE_SET', 'CARD_DUE_DATE_CLEARED', 'CARD_DONE_SET', 'CARD_LABEL_ADDED', 'CARD_LABEL_REMOVED', 'COMMENT_ADDED', 'COMMENT_DELETED', 'LABEL_CREATED', 'LABEL_UPDATED', 'LABEL_DELETED');

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "boardId" TEXT,
    "actorId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_workspaceId_idx" ON "Activity"("workspaceId");

-- CreateIndex
CREATE INDEX "Activity_boardId_idx" ON "Activity"("boardId");

-- CreateIndex
CREATE INDEX "Activity_actorId_idx" ON "Activity"("actorId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
