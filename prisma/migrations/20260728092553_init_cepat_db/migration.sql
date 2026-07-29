-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('MASUK', 'KELUAR');

-- CreateTable
CREATE TABLE "Role" (
    "id_role" TEXT NOT NULL,
    "nama_role" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id_role")
);

-- CreateTable
CREATE TABLE "StatusTask" (
    "id_status_task" TEXT NOT NULL,
    "nama_status" TEXT NOT NULL,

    CONSTRAINT "StatusTask_pkey" PRIMARY KEY ("id_status_task")
);

-- CreateTable
CREATE TABLE "StatusTaskApplicants" (
    "id_status_task_applicants" TEXT NOT NULL,
    "nama_status" TEXT NOT NULL,

    CONSTRAINT "StatusTaskApplicants_pkey" PRIMARY KEY ("id_status_task_applicants")
);

-- CreateTable
CREATE TABLE "SkillsMaster" (
    "id_skill_master" TEXT NOT NULL,
    "nama_skill" TEXT NOT NULL,

    CONSTRAINT "SkillsMaster_pkey" PRIMARY KEY ("id_skill_master")
);

-- CreateTable
CREATE TABLE "User" (
    "id_user" TEXT NOT NULL,
    "id_role" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "avatar_url" TEXT,
    "bio" TEXT,
    "pendidikan_terakhir" TEXT,
    "rating_avg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "total_completed" INTEGER NOT NULL DEFAULT 0,
    "total_balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "username" TEXT NOT NULL,
    "alamat" TEXT,
    "no_telpon" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "Task" (
    "id_tasks" TEXT NOT NULL,
    "id_requester" TEXT NOT NULL,
    "id_status_task" TEXT NOT NULL,
    "judul_tugas" TEXT NOT NULL,
    "deskripsi_tugas" TEXT NOT NULL,
    "estimasi_waktu" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "lokasi_geo" geography(Point, 4326),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id_tasks")
);

-- CreateTable
CREATE TABLE "Transactions" (
    "id_transactions" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "nominal" DOUBLE PRECISION NOT NULL,
    "tipe_transaksi" "TransactionType" NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("id_transactions")
);

-- CreateTable
CREATE TABLE "SkillsUser" (
    "id_skills_user" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "id_skills_master" TEXT NOT NULL,
    "deskripsi_pengalaman" TEXT,
    "portofolio_url" TEXT,
    "certificate_url" TEXT,

    CONSTRAINT "SkillsUser_pkey" PRIMARY KEY ("id_skills_user")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id_notifications" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id_notifications")
);

-- CreateTable
CREATE TABLE "TaskRequirements" (
    "id_task_requirements" TEXT NOT NULL,
    "id_tasks" TEXT NOT NULL,
    "id_skill_master" TEXT NOT NULL,

    CONSTRAINT "TaskRequirements_pkey" PRIMARY KEY ("id_task_requirements")
);

-- CreateTable
CREATE TABLE "TaskApplicants" (
    "id_task_applicants" TEXT NOT NULL,
    "id_status_task_applicants" TEXT NOT NULL,
    "id_worker" TEXT NOT NULL,
    "id_tasks" TEXT NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskApplicants_pkey" PRIMARY KEY ("id_task_applicants")
);

-- CreateTable
CREATE TABLE "Reviews" (
    "id_reviews" TEXT NOT NULL,
    "id_tasks" TEXT NOT NULL,
    "id_rater" TEXT NOT NULL,
    "id_ratee" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "url_photo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reviews_pkey" PRIMARY KEY ("id_reviews")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_nama_role_key" ON "Role"("nama_role");

-- CreateIndex
CREATE UNIQUE INDEX "StatusTask_nama_status_key" ON "StatusTask"("nama_status");

-- CreateIndex
CREATE UNIQUE INDEX "StatusTaskApplicants_nama_status_key" ON "StatusTaskApplicants"("nama_status");

-- CreateIndex
CREATE UNIQUE INDEX "SkillsMaster_nama_skill_key" ON "SkillsMaster"("nama_skill");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SkillsUser_id_user_id_skills_master_key" ON "SkillsUser"("id_user", "id_skills_master");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "Role"("id_role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_id_requester_fkey" FOREIGN KEY ("id_requester") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_id_status_task_fkey" FOREIGN KEY ("id_status_task") REFERENCES "StatusTask"("id_status_task") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillsUser" ADD CONSTRAINT "SkillsUser_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillsUser" ADD CONSTRAINT "SkillsUser_id_skills_master_fkey" FOREIGN KEY ("id_skills_master") REFERENCES "SkillsMaster"("id_skill_master") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskRequirements" ADD CONSTRAINT "TaskRequirements_id_tasks_fkey" FOREIGN KEY ("id_tasks") REFERENCES "Task"("id_tasks") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskRequirements" ADD CONSTRAINT "TaskRequirements_id_skill_master_fkey" FOREIGN KEY ("id_skill_master") REFERENCES "SkillsMaster"("id_skill_master") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplicants" ADD CONSTRAINT "TaskApplicants_id_status_task_applicants_fkey" FOREIGN KEY ("id_status_task_applicants") REFERENCES "StatusTaskApplicants"("id_status_task_applicants") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplicants" ADD CONSTRAINT "TaskApplicants_id_worker_fkey" FOREIGN KEY ("id_worker") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskApplicants" ADD CONSTRAINT "TaskApplicants_id_tasks_fkey" FOREIGN KEY ("id_tasks") REFERENCES "Task"("id_tasks") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_id_tasks_fkey" FOREIGN KEY ("id_tasks") REFERENCES "Task"("id_tasks") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_id_rater_fkey" FOREIGN KEY ("id_rater") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_id_ratee_fkey" FOREIGN KEY ("id_ratee") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
