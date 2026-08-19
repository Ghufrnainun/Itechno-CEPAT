import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  try {
    console.log('🔄 Adding Bidding columns to Task if not exists...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "is_bidding" BOOLEAN NOT NULL DEFAULT false;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "budget_min" DOUBLE PRECISION;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "budget_max" DOUBLE PRECISION;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "held_slots_json" TEXT;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "max_applicants" INTEGER NOT NULL DEFAULT 1;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "max_apply_attempts" INTEGER NOT NULL DEFAULT 3;
    `)

    console.log('🔄 Adding Bidding columns to TaskApplicants if not exists...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "TaskApplicants" ADD COLUMN IF NOT EXISTS "bid_amount" DOUBLE PRECISION;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "TaskApplicants" ADD COLUMN IF NOT EXISTS "apply_count" INTEGER NOT NULL DEFAULT 1;
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "TaskApplicants" ADD COLUMN IF NOT EXISTS "alasan_penolakan" VARCHAR(500);
    `)

    console.log('🔄 Adding indexes for Bidding...')
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_task_bidding" ON "Task"("is_bidding");
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_task_applicants_bid" ON "TaskApplicants"("bid_amount");
    `)

    console.log('✅ Successfully applied Bidding database schema updates!')
  } catch (err) {
    console.error('❌ Error executing bidding database initialization:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
