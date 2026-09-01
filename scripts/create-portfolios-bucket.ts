import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log("Connecting to database using pg client...");
  
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });

  await client.connect();
  console.log("Connected.");

  const sql = `
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('portfolios', 'portfolios', true) 
    ON CONFLICT (id) DO NOTHING; 

    -- Enable RLS (if not already enabled)
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 
  `;

  await client.query(sql);
  console.log("Bucket created.");

  const policies = [
    `CREATE POLICY "Public portfolios are viewable by everyone." 
     ON storage.objects FOR SELECT 
     USING ( bucket_id = 'portfolios' );`,

    `CREATE POLICY "Users can upload portfolios" 
     ON storage.objects FOR INSERT TO authenticated 
     WITH CHECK ( bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1] );`,

    `CREATE POLICY "Users can update own portfolios" 
     ON storage.objects FOR UPDATE TO authenticated 
     USING ( bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1] );`,

    `CREATE POLICY "Users can delete own portfolios" 
     ON storage.objects FOR DELETE TO authenticated 
     USING ( bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1] );`
  ];

  for (const policy of policies) {
    try {
      await client.query(policy);
      console.log("Policy created.");
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        console.log("Policy already exists, skipping...");
      } else {
        console.error("Error creating policy:", e.message);
      }
    }
  }

  await client.end();
  console.log("Migration complete.");
}

main().catch(console.error);
