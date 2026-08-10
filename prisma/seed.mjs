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

  const roles = {
    Admin: await prisma.role.upsert({
      where: { nama_role: "Admin" },
      update: {},
      create: { nama_role: "Admin" },
    }),
    Requester: await prisma.role.upsert({
      where: { nama_role: "Requester" },
      update: {},
      create: { nama_role: "Requester" },
    }),
    Worker: await prisma.role.upsert({
      where: { nama_role: "Worker" },
      update: {},
      create: { nama_role: "Worker" },
    }),
  };

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

    await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {
        auth_id: authUser.id,
        id_role: roles[demoUser.role].id_role,
        nama_lengkap: demoUser.nama_lengkap,
        username: demoUser.username,
      },
      create: {
        auth_id: authUser.id,
        id_role: roles[demoUser.role].id_role,
        nama_lengkap: demoUser.nama_lengkap,
        username: demoUser.username,
        email: demoUser.email,
      },
    });
  }

  console.log(`Seed selesai. ${demoUsers.length} akun demo siap dipakai. Password: ${password}`);
} finally {
  await prisma.$disconnect();
}
