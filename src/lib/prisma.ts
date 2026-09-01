import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function createPrismaClient(): PrismaClient {
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString: process.env.DATABASE_URL!,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

  if (!globalForPrisma.pool) {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}