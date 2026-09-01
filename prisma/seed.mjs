import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

const password = process.env.SEED_AUTH_PASSWORD ?? "Password123!";
const demoUsers = [
  { email: "admin@itechno.id", username: "admin_itechno", nama_lengkap: "Super Admin ITechno", role: "Admin" },
  { email: "budi@cepat.com", username: "budi", nama_lengkap: "Budi Santoso", role: "Requester" },
  { email: "andi@cepat.com", username: "andi", nama_lengkap: "Andi Pratama", role: "Worker" },
  { email: "sari@cepat.com", username: "sari", nama_lengkap: "Sari Lestari", role: "Requester" },
  { email: "rina@cepat.com", username: "rina", nama_lengkap: "Rina Maharani", role: "Worker" },
  // Tambahan akun demo untuk cold start
  { email: "joko@cepat.com", username: "joko", nama_lengkap: "Joko Widodo", role: "Worker" },
  { email: "maya@cepat.com", username: "maya", nama_lengkap: "Maya Anggraini", role: "Worker" },
  { email: "citra@cepat.com", username: "citra", nama_lengkap: "Citra Kirana", role: "Requester" },
];

for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL"]) {
  if (!process.env[name]) throw new Error(`${name} wajib diisi untuk menjalankan seed.`);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;

  console.log("Seeding Roles...");
  const roles = {
    Admin: await prisma.role.upsert({ where: { nama_role: "Admin" }, update: {}, create: { nama_role: "Admin" } }),
    Requester: await prisma.role.upsert({ where: { nama_role: "Requester" }, update: {}, create: { nama_role: "Requester" } }),
    Worker: await prisma.role.upsert({ where: { nama_role: "Worker" }, update: {}, create: { nama_role: "Worker" } }),
  };

  console.log("Seeding Statuses...");
  const taskStatuses = ["OPEN", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  const taskStatusIds = {};
  for (const status of taskStatuses) {
    const s = await prisma.statusTask.upsert({ where: { nama_status: status }, update: {}, create: { nama_status: status } });
    taskStatusIds[status] = s.id_status_task;
  }

  const applicantStatuses = ["PENDING", "ACCEPTED", "REJECTED"];
  const applicantStatusIds = {};
  for (const status of applicantStatuses) {
    const s = await prisma.statusTaskApplicants.upsert({ where: { nama_status: status }, update: {}, create: { nama_status: status } });
    applicantStatusIds[status] = s.id_status_task_applicants;
  }

  console.log("Seeding Categories...");
  const categories = [
    { nama_kategori: "Desain & Kreatif", icon: "Palette" },
    { nama_kategori: "Pemrograman & TI", icon: "Code" },
    { nama_kategori: "Fotografi & Videografi", icon: "Camera" },
    { nama_kategori: "Penulisan & Penerjemahan", icon: "PenTool" },
    { nama_kategori: "Administrasi & Data Entry", icon: "FileText" },
    { nama_kategori: "Pemasaran & Sales", icon: "TrendingUp" },
    { nama_kategori: "Perbaikan & Tukang", icon: "Wrench" },
    { nama_kategori: "Logistik & Kurir", icon: "Truck" },
    { nama_kategori: "Event & Pertunjukan", icon: "Mic" },
    { nama_kategori: "Asisten Pribadi", icon: "User" },
    { nama_kategori: "Pendidikan & Tutor", icon: "GraduationCap" },
    { nama_kategori: "Lain-lain", icon: "Box" },
  ];
  const categoryIds = {};
  for (const cat of categories) {
    const c = await prisma.taskCategory.upsert({ 
      where: { nama_kategori: cat.nama_kategori }, 
      update: { icon: cat.icon }, 
      create: { nama_kategori: cat.nama_kategori, icon: cat.icon } 
    });
    categoryIds[cat.nama_kategori] = c.id_category;
  }

  console.log("Seeding Skills...");
  const skillsList = [
    { nama_skill: "Desain Grafis", icon: "Palette" },
    { nama_skill: "UI/UX Design", icon: "LayoutTemplate" },
    { nama_skill: "Web Development", icon: "Code" },
    { nama_skill: "Mobile App Development", icon: "Smartphone" },
    { nama_skill: "Data Entry", icon: "Database" },
    { nama_skill: "Manajemen Media Sosial", icon: "Share2" },
    { nama_skill: "Fotografi", icon: "Camera" },
    { nama_skill: "Video Editing", icon: "Video" },
    { nama_skill: "Copywriting", icon: "Feather" },
    { nama_skill: "Terjemahan Bahasa", icon: "Languages" },
    { nama_skill: "SEO & Pemasaran Digital", icon: "TrendingUp" },
    { nama_skill: "Teknisi Komputer", icon: "Monitor" },
    { nama_skill: "Perbaikan Listrik", icon: "Zap" },
    { nama_skill: "Instalasi Pipa", icon: "Wrench" },
    { nama_skill: "Tutor Matematika", icon: "Calculator" },
    { nama_skill: "Tutor Bahasa Inggris", icon: "BookOpen" },
    { nama_skill: "Pengemudi / Kurir", icon: "Truck" },
    { nama_skill: "Asisten Event", icon: "Users" },
    { nama_skill: "Pemrograman Python", icon: "Terminal" },
    { nama_skill: "Akuntansi & Keuangan", icon: "Calculator" },
    { nama_skill: "Keamanan Siber", icon: "Shield" },
    { nama_skill: "Customer Service", icon: "Headset" },
    { nama_skill: "Desain Logo", icon: "Image" },
    { nama_skill: "Penulisan Artikel", icon: "FileText" },
    { nama_skill: "Animasi 3D", icon: "Box" },
    { nama_skill: "Voice Over", icon: "Mic" },
  ];
  for (const sk of skillsList) {
    await prisma.skillsMaster.upsert({ 
      where: { nama_skill: sk.nama_skill }, 
      update: { icon: sk.icon }, 
      create: { nama_skill: sk.nama_skill, icon: sk.icon } 
    });
  }

  console.log("Seeding Users...");
  const userIds = {};
  for (const demoUser of demoUsers) {
    let authUser = users.users.find((user) => user.email?.toLowerCase() === demoUser.email);
    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: demoUser.email,
        password,
        email_confirm: true,
        user_metadata: { nama_lengkap: demoUser.nama_lengkap, username: demoUser.username },
      });
      if (error || !data.user) throw error ?? new Error(`Gagal membuat ${demoUser.email}.`);
      authUser = data.user;
    } else {
      const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
        password,
        email_confirm: true,
        user_metadata: { nama_lengkap: demoUser.nama_lengkap, username: demoUser.username },
      });
      if (error || !data.user) throw error ?? new Error(`Gagal memperbarui ${demoUser.email}.`);
      authUser = data.user;
    }

    const u = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {
        auth_id: authUser.id,
        id_role: roles[demoUser.role].id_role,
        nama_lengkap: demoUser.nama_lengkap,
        username: demoUser.username,
        total_balance: demoUser.role === 'Requester' ? 500000 : 0, 
      },
      create: {
        auth_id: authUser.id,
        id_role: roles[demoUser.role].id_role,
        nama_lengkap: demoUser.nama_lengkap,
        username: demoUser.username,
        email: demoUser.email,
        total_balance: demoUser.role === 'Requester' ? 500000 : 0,
      },
    });
    userIds[demoUser.username] = u.id_user;
  }

  console.log("Seeding Dummy Tasks...");
  await prisma.task.deleteMany({});
  
  await prisma.$queryRaw`
    INSERT INTO "Task" (
      id_tasks, id_requester, id_status_task, judul_tugas, deskripsi_tugas,
      estimasi_waktu, kompensasi, id_category, is_bidding, budget_min, budget_max, 
      max_applicants, max_apply_attempts, created_at, lokasi_geo
    ) VALUES (
      gen_random_uuid(), ${userIds.budi}, ${taskStatusIds.OPEN}, 
      'Desain Logo Aplikasi Fintech', 'Butuh desainer handal untuk logo fintech baru. Harus modern dan elegan.',
      '3 Hari', 150000, ${categoryIds["Desain & Kreatif"]}, true, 100000, 200000, 
      1, 3, NOW(), ST_MakePoint(110.367003, -7.782865)::geography
    )
  `;

  await prisma.$queryRaw`
    INSERT INTO "Task" (
      id_tasks, id_requester, id_status_task, judul_tugas, deskripsi_tugas,
      estimasi_waktu, kompensasi, id_category, is_bidding, budget_min, budget_max, 
      max_applicants, max_apply_attempts, created_at, lokasi_geo
    ) VALUES (
      gen_random_uuid(), ${userIds.sari}, ${taskStatusIds.OPEN}, 
      'Perbaiki Pipa Bocor di Dapur', 'Pipa dapur rumah saya bocor parah. Tolong segera datang bawa alat lengkap.',
      '1 Jam', 50000, ${categoryIds["Perbaikan & Tukang"]}, false, null, null, 
      1, 3, NOW(), ST_MakePoint(110.370000, -7.780000)::geography
    )
  `;

  const t3Id = await prisma.$queryRaw`
    INSERT INTO "Task" (
      id_tasks, id_requester, id_status_task, judul_tugas, deskripsi_tugas,
      estimasi_waktu, kompensasi, id_category, is_bidding, budget_min, budget_max, 
      max_applicants, max_apply_attempts, created_at, lokasi_geo, held_slots_json
    ) VALUES (
      gen_random_uuid(), ${userIds.citra}, ${taskStatusIds.ACCEPTED}, 
      'Pembuatan Script Web Scraping Python', 'Perlu script untuk scraping data e-commerce. Output format CSV.',
      '2 Hari', 200000, ${categoryIds["Pemrograman & TI"]}, true, 150000, 250000, 
      1, 3, NOW(), ST_MakePoint(110.375000, -7.790000)::geography, '{}'
    ) RETURNING id_tasks
  `;
  
  const task3 = t3Id[0].id_tasks;
  
  const app3 = await prisma.taskApplicants.create({
    data: {
      id_tasks: task3,
      id_worker: userIds.andi,
      id_status_task_applicants: applicantStatusIds.ACCEPTED,
      pesan: 'Saya ahli Python dan bsia scraping',
      bid_amount: 180000,
      apply_count: 1,
      worker_confirmed: true,
    }
  });
  
  await prisma.task.update({
    where: { id_tasks: task3 },
    data: { held_slots_json: JSON.stringify({ [app3.id_task_applicants]: 180000 }) }
  });

  const t4Id = await prisma.$queryRaw`
    INSERT INTO "Task" (
      id_tasks, id_requester, id_status_task, judul_tugas, deskripsi_tugas,
      estimasi_waktu, kompensasi, id_category, is_bidding, budget_min, budget_max, 
      max_applicants, max_apply_attempts, created_at, completed_at, lokasi_geo
    ) VALUES (
      gen_random_uuid(), ${userIds.budi}, ${taskStatusIds.COMPLETED}, 
      'Tulis Artikel Blog Teknologi', 'Minta 2 artikel panjang 1000 kata seputar AI.',
      '4 Hari', 100000, ${categoryIds["Penulisan & Penerjemahan"]}, false, null, null, 
      1, 3, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 days', ST_MakePoint(110.380000, -7.795000)::geography
    ) RETURNING id_tasks
  `;
  
  const task4 = t4Id[0].id_tasks;
  
  await prisma.taskApplicants.create({
    data: {
      id_tasks: task4,
      id_worker: userIds.rina,
      id_status_task_applicants: applicantStatusIds.ACCEPTED,
      pesan: 'Saya suka nulis artikel.',
      apply_count: 1,
      worker_confirmed: true,
    }
  });

  await prisma.reviews.create({
    data: {
      id_tasks: task4,
      id_rater: userIds.budi,
      id_ratee: userIds.rina,
      rating: 5,
      comment: 'Bagus banget artikelnya!',
    }
  });

  console.log(`Seed selesai. ${demoUsers.length} akun demo, kategori, status, dan 4 dummy tasks siap dipakai. Password: ${password}`);
} catch (err) {
  console.error("Gagal melakukan seed:", err);
} finally {
  await prisma.$disconnect();
}
