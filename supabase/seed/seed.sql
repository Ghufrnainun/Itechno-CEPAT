-- ============================================================
-- Seeding Initial Data for CEPAT
-- ============================================================

-- Seed Roles
INSERT INTO "Role" ("id_role", "nama_role") VALUES 
(gen_random_uuid()::text, 'Requester'),
(gen_random_uuid()::text, 'Worker')
ON CONFLICT ("nama_role") DO NOTHING;

-- Seed Task Statuses
INSERT INTO "StatusTask" ("id_status_task", "nama_status") VALUES 
(gen_random_uuid()::text, 'OPEN'),
(gen_random_uuid()::text, 'ASSIGNED'),
(gen_random_uuid()::text, 'IN_PROGRESS'),
(gen_random_uuid()::text, 'SUBMITTED'),
(gen_random_uuid()::text, 'COMPLETED'),
(gen_random_uuid()::text, 'CANCELLED')
ON CONFLICT ("nama_status") DO NOTHING;

-- Seed Applicant Statuses
INSERT INTO "StatusTaskApplicants" ("id_status_task_applicants", "nama_status") VALUES 
(gen_random_uuid()::text, 'PENDING'),
(gen_random_uuid()::text, 'ACCEPTED'),
(gen_random_uuid()::text, 'REJECTED')
ON CONFLICT ("nama_status") DO NOTHING;

-- Seed initial Skills Master
INSERT INTO "SkillsMaster" ("id_skill_master", "nama_skill") VALUES 
(gen_random_uuid()::text, 'Fotografi & Videografi'),
(gen_random_uuid()::text, 'Data Entry & Administrasi'),
(gen_random_uuid()::text, 'Desain Grafis'),
(gen_random_uuid()::text, 'Penulisan & Konten')
ON CONFLICT ("nama_skill") DO NOTHING;
