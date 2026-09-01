import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase env vars');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Connecting to Supabase Storage API...');

  // 1. Create the bucket via Storage API
  const { data, error } = await supabase.storage.createBucket('portfolios', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 5242880 // 5MB
  });

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
      console.log('Bucket "portfolios" already exists in Storage API (or we hit a duplicate).');
    } else {
      console.error('Error creating bucket via API:', error);
    }
  } else {
    console.log('Bucket "portfolios" created successfully via Storage API:', data);
  }

  // 2. We already inserted into storage.buckets via SQL, but doing it via API ensures 
  // the storage-api microservice knows about it. If it was broken, maybe we should get it?
  const { data: getBucket, error: getError } = await supabase.storage.getBucket('portfolios');
  if (getError) {
    console.error('Still cannot get bucket:', getError);
  } else {
    console.log('Verified bucket exists via API:', getBucket);
  }

  console.log('Done.');
}

main().catch(console.error);
