import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function run() {
  await prisma.taskCategory.deleteMany({ where: { nama_kategori: 'Lain-lain' } });
  console.log('Deleted Lain-lain');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
