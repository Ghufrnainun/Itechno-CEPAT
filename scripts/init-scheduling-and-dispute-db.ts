import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  try {
    console.log('🔄 Adding scheduled_at and scheduled_end columns to Task if not exists...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP(3);
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "scheduled_end" TIMESTAMP(3);
    `)

    console.log('🔄 Creating DisputeStatus enum if not exists...')
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DisputeStatus') THEN
          CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED_FAVOR_WORKER', 'RESOLVED_FAVOR_REQUESTER', 'CLOSED');
        END IF;
      END $$;
    `)

    console.log('🔄 Creating Dispute tables if not exists...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."Dispute" (
        "id_dispute" TEXT NOT NULL,
        "id_task" TEXT NOT NULL,
        "id_reporter" TEXT NOT NULL,
        "id_respondent" TEXT NOT NULL,
        "reason" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
        "resolution" TEXT,
        "resolved_by" TEXT,
        "resolved_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id_dispute")
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."DisputeEvidence" (
        "id_evidence" TEXT NOT NULL,
        "id_dispute" TEXT NOT NULL,
        "id_user" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "DisputeEvidence_pkey" PRIMARY KEY ("id_evidence")
      );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."DisputeMessage" (
        "id_message" TEXT NOT NULL,
        "id_dispute" TEXT NOT NULL,
        "id_sender" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "is_admin" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "DisputeMessage_pkey" PRIMARY KEY ("id_message")
      );
    `)

    console.log('🔄 Adding Foreign Keys for Disputes if not exists...')
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Dispute_id_task_fkey') THEN
          ALTER TABLE "public"."Dispute" ADD CONSTRAINT "Dispute_id_task_fkey" FOREIGN KEY ("id_task") REFERENCES "public"."Task"("id_tasks") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Dispute_id_reporter_fkey') THEN
          ALTER TABLE "public"."Dispute" ADD CONSTRAINT "Dispute_id_reporter_fkey" FOREIGN KEY ("id_reporter") REFERENCES "public"."User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Dispute_id_respondent_fkey') THEN
          ALTER TABLE "public"."Dispute" ADD CONSTRAINT "Dispute_id_respondent_fkey" FOREIGN KEY ("id_respondent") REFERENCES "public"."User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DisputeEvidence_id_dispute_fkey') THEN
          ALTER TABLE "public"."DisputeEvidence" ADD CONSTRAINT "DisputeEvidence_id_dispute_fkey" FOREIGN KEY ("id_dispute") REFERENCES "public"."Dispute"("id_dispute") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DisputeMessage_id_dispute_fkey') THEN
          ALTER TABLE "public"."DisputeMessage" ADD CONSTRAINT "DisputeMessage_id_dispute_fkey" FOREIGN KEY ("id_dispute") REFERENCES "public"."Dispute"("id_dispute") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `)

    console.log('✅ Successfully initialized Task Scheduling columns & Dispute tables!')
  } catch (err) {
    console.error('❌ Error executing database initialization:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
