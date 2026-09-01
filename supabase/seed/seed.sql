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

-- Seed Task Categories
INSERT INTO "TaskCategory" ("id_category", "nama_kategori", "icon") VALUES 
(gen_random_uuid()::text, 'Desain & Kreatif', 'Palette'),
(gen_random_uuid()::text, 'Pemrograman & TI', 'Code'),
(gen_random_uuid()::text, 'Fotografi & Videografi', 'Camera'),
(gen_random_uuid()::text, 'Penulisan & Penerjemahan', 'PenTool'),
(gen_random_uuid()::text, 'Administrasi & Data Entry', 'FileText'),
(gen_random_uuid()::text, 'Pemasaran & Sales', 'TrendingUp'),
(gen_random_uuid()::text, 'Perbaikan & Tukang', 'Wrench'),
(gen_random_uuid()::text, 'Logistik & Kurir', 'Truck'),
(gen_random_uuid()::text, 'Event & Pertunjukan', 'Mic'),
(gen_random_uuid()::text, 'Asisten Pribadi', 'User'),
(gen_random_uuid()::text, 'Pendidikan & Tutor', 'GraduationCap')
ON CONFLICT ("nama_kategori") DO NOTHING;

-- Seed initial Skills Master
INSERT INTO "SkillsMaster" ("id_skill_master", "nama_skill", "icon") VALUES 
(gen_random_uuid()::text, 'Desain Grafis', 'Palette'),
(gen_random_uuid()::text, 'UI/UX Design', 'LayoutTemplate'),
(gen_random_uuid()::text, 'Web Development', 'Code'),
(gen_random_uuid()::text, 'Mobile App Development', 'Smartphone'),
(gen_random_uuid()::text, 'Data Entry', 'Database'),
(gen_random_uuid()::text, 'Manajemen Media Sosial', 'Share2'),
(gen_random_uuid()::text, 'Fotografi', 'Camera'),
(gen_random_uuid()::text, 'Video Editing', 'Video'),
(gen_random_uuid()::text, 'Copywriting', 'Feather'),
(gen_random_uuid()::text, 'Terjemahan Bahasa', 'Languages'),
(gen_random_uuid()::text, 'SEO & Pemasaran Digital', 'TrendingUp'),
(gen_random_uuid()::text, 'Teknisi Komputer', 'Monitor'),
(gen_random_uuid()::text, 'Perbaikan Listrik', 'Zap'),
(gen_random_uuid()::text, 'Instalasi Pipa', 'Wrench'),
(gen_random_uuid()::text, 'Tutor Matematika', 'Calculator'),
(gen_random_uuid()::text, 'Tutor Bahasa Inggris', 'BookOpen'),
(gen_random_uuid()::text, 'Pengemudi / Kurir', 'Truck'),
(gen_random_uuid()::text, 'Asisten Event', 'Users'),
(gen_random_uuid()::text, 'Pemrograman Python', 'Terminal'),
(gen_random_uuid()::text, 'Akuntansi & Keuangan', 'Calculator'),
(gen_random_uuid()::text, 'Keamanan Siber', 'Shield'),
(gen_random_uuid()::text, 'Customer Service', 'Headset'),
(gen_random_uuid()::text, 'Desain Logo', 'Image'),
(gen_random_uuid()::text, 'Penulisan Artikel', 'FileText'),
(gen_random_uuid()::text, 'Animasi 3D', 'Box'),
(gen_random_uuid()::text, 'Voice Over', 'Mic')
ON CONFLICT ("nama_skill") DO UPDATE SET "icon" = EXCLUDED.icon;
