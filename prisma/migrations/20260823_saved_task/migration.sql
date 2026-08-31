-- SavedTask: bookmark tugas oleh user
-- AlterTable
CREATE TABLE "SavedTask" (
    "id_saved" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "id_tasks" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedTask_pkey" PRIMARY KEY ("id_saved")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedTask_id_user_id_tasks_key" ON "SavedTask"("id_user", "id_tasks");

-- CreateIndex
CREATE INDEX "SavedTask_id_user_idx" ON "SavedTask"("id_user");

-- AddForeignKey
ALTER TABLE "SavedTask" ADD CONSTRAINT "SavedTask_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedTask" ADD CONSTRAINT "SavedTask_id_tasks_fkey" FOREIGN KEY ("id_tasks") REFERENCES "Task"("id_tasks") ON DELETE CASCADE ON UPDATE CASCADE;
