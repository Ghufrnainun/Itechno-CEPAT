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
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
    });

  pool.on('error', (err) => {
    // Tangani socket disconnect pada koneksi idle tanpa melempar uncaught error
    console.warn('[pg.Pool] Idle connection notice (reconnecting):', err.message);
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