# Server-Side Upload Setup

Your decentralized storage app now supports both client-side and server-side file uploads!

## 🎯 Two Upload Methods:

### 1. **Client-Side Upload** (Default)
- Files stored directly to IPFS via Helia browser node
- Metadata stored in OrbitDB (local browser database)
- Fully decentralized, no server required

### 2. **Server-Side Upload** (New!)
- Files uploaded to Filebase S3 (IPFS-compatible storage)
- Metadata stored in Supabase PostgreSQL database  
- Wallet signature verification for security
- Better reliability and performance

## 🚀 Server Setup Steps:

### Step 1: Set up Filebase Account
1. Go to [Filebase.com](https://filebase.com) and create an account
2. Create an S3 bucket for IPFS storage
3. Generate S3 Access Keys from your dashboard
4. Copy your credentials

### Step 2: Set up Supabase Project
1. Go to [Supabase.com](https://supabase.com) and create a project
2. In your Supabase dashboard, go to SQL Editor
3. Run the SQL from `supabase-schema.sql` to create the files table
4. Go to Settings > API to get your URL and Service Role Key

### Step 3: Configure Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your credentials:
   ```bash
   # Filebase S3 Configuration
   FILEBASE_S3_KEY=your_filebase_access_key_here
   FILEBASE_S3_SECRET=your_filebase_secret_key_here  
   FILEBASE_BUCKET=your_filebase_bucket_name
   FILEBASE_REGION=us-east-1
   FILEBASE_ENDPOINT=https://s3.filebase.com

   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### Step 4: Test the Setup
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to the dashboard and try uploading a file
3. Select "Server-side (Filebase + Supabase)" option
4. The app will prompt MetaMask to sign a message for authentication
5. File will be uploaded to Filebase and metadata stored in Supabase

## 🔒 Security Features:

- **Wallet Signature Verification**: Each upload requires signing a timestamped message
- **Replay Attack Protection**: 5-minute timestamp window prevents old signatures
- **File Size Limits**: 50MB maximum file size
- **Environment Isolation**: Different buckets/databases for dev/production

## 🛠 API Endpoints:

- `POST /api/upload` - Server-side file upload with signature verification

## 📁 File Storage Locations:

### Client-Side:
- **Files**: IPFS network (via Helia browser node)
- **Metadata**: OrbitDB (local browser storage)

### Server-Side:  
- **Files**: Filebase S3 bucket (automatically pins to IPFS)
- **Metadata**: Supabase PostgreSQL database
- **Access**: Via IPFS gateway URLs or direct S3 URLs

## 🚦 Usage:

Users can now choose their preferred upload method:
- **Client-side**: Fully decentralized, works offline, no server costs
- **Server-side**: More reliable, better performance, easier file management

Both methods maintain the same security model with MetaMask wallet integration!