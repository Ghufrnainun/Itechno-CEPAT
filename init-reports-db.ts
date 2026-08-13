import 'dotenv/config'
import { prisma } from './src/lib/prisma'

async function main() {
  try {
    console.log('🔄 Creating UserReport table if not exists...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."UserReport" (
          "id_report" TEXT NOT NULL,
          "user_id" TEXT NOT NULL,
          "kategori" TEXT NOT NULL,
          "subjek" TEXT NOT NULL,
          "deskripsi" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id_report")
      );
    `)

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UserReport_user_id_fkey'
        ) THEN
          ALTER TABLE "public"."UserReport" ADD CONSTRAINT "UserReport_user_id_fkey"
          FOREIGN KEY ("user_id") REFERENCES "public"."User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `)

    console.log('✅ Successfully created UserReport table safely!')
  } catch (err) {
    console.error('❌ Error creating table:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
