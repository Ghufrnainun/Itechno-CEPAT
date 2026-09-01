INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolios', 'portfolios', true) 
ON CONFLICT (id) DO NOTHING; 

-- Policies for 'portfolios' bucket

CREATE POLICY "Public portfolios are viewable by everyone." 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'portfolios' ); 

CREATE POLICY "Users can upload portfolios" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK ( bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1] ); 

CREATE POLICY "Users can update own portfolios" 
ON storage.objects FOR UPDATE TO authenticated 
USING ( bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1] ); 

CREATE POLICY "Users can delete own portfolios" 
ON storage.objects FOR DELETE TO authenticated 
USING ( bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1] );
