-- Supabase SQL schema for decentralized file storage
-- Run this in your Supabase SQL editor to create the required table

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  file_name TEXT NOT NULL,
  cid TEXT DEFAULT '',
  file_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_files_wallet_address ON files(wallet_address);
CREATE INDEX IF NOT EXISTS idx_files_cid ON files(cid);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_files_updated_at ON files;
CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional but recommended)
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own files
-- (you may want to customize this based on your security requirements)
CREATE POLICY "Users can view own files" ON files
  FOR SELECT USING (true); -- Allow all for now, customize as needed

CREATE POLICY "Users can insert own files" ON files  
  FOR INSERT WITH CHECK (true); -- Allow all for now, customize as needed

CREATE POLICY "Users can update own files" ON files
  FOR UPDATE USING (true); -- Allow all for now, customize as needed

-- Grant permissions to authenticated users (adjust as needed)
GRANT ALL ON files TO authenticated;
GRANT ALL ON files TO anon; -- Remove this if you want to require authentication