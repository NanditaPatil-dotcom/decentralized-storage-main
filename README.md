Decentralized File Storage DApp

A Web3-powered decentralized file storage platform that allows users to securely upload, store, and retrieve files using IPFS/Filebase with wallet-based authentication. Metadata is persisted in Supabase for cross-browser access.

Tech Stack:

Frontend: React (Next.js), TailwindCSS, ethers.js, MetaMask

Backend: Next.js API routes (serverless on Vercel)

Storage: Filebase/IPFS

Metadata Index: Supabase (wallet → CID mapping)

Blockchain (Optional): Solidity smart contract for on-chain file proof

Features

Wallet Authentication: Login with MetaMask; verify user identity via signed messages.

File Upload: Upload files directly to IPFS via Filebase; returns CID for content addressing.

Persistent File List: Wallet → CID mappings stored in Supabase; accessible from any browser or device.

Cross-Browser Access: Files and metadata persist even after logout or switching devices.

Download Files: Retrieve files via IPFS/Filebase gateway using CID.

Optional On-Chain Anchoring: Store file ownership proof in your existing Solidity contract.



How It Works

Login:

User connects their MetaMask wallet.

Wallet signs a message → sent to serverless API to verify identity.

Upload File:

Frontend sends file + wallet info + signed message to /api/upload.

Backend uploads file to Filebase/IPFS → gets CID.

CID, file name, wallet, and timestamp stored in Supabase.

Fetch Files:

On login, frontend requests /api/files?wallet=<walletAddress>.

Supabase returns all CIDs associated with wallet.

Files displayed in dashboard; can be downloaded via IPFS/Filebase gateway.

Optional On-Chain Proof:

Backend can call Solidity contract to anchor {walletAddress, CID}.

Transaction hash can be stored in Supabase.

Flow Diagram (Conceptual)
Frontend (Browser)
   │
   ├─ MetaMask Wallet Auth → Backend verifies signature
   │
   ├─ Upload File → Backend
         ├─ Filebase/IPFS (file storage & CID generation)
         └─ Supabase (store wallet → CID mapping)
   │
   └─ Fetch Files → Backend → Supabase → Frontend → Display list

Setup & Deployment

Clone the repository

git clone <repo-url>
cd <repo-folder>


Install dependencies

npm install
# or
yarn install


Set Environment Variables (Vercel or local .env)

SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-service-role-key>
FILEBASE_ACCESS_KEY=<your-filebase-access-key>
FILEBASE_SECRET_KEY=<your-filebase-secret-key>


Run locally

npm run dev
# or
yarn dev


Deploy

Deploy frontend + backend API routes on Vercel.

Ensure environment variables are set in Vercel dashboard.

Testing

Upload a file → CID returned → file appears in dashboard.

Logout → login on different browser → file list still appears.

Download file → verify content matches uploaded file via IPFS/Filebase gateway.

Optional: check Solidity contract for on-chain proof of ownership.

Notes

Files are stored decentralized on IPFS/Filebase.

Supabase is used only as an index for wallet → CID mapping to enable cross-browser persistence.

All wallet interactions are verified using signed messages → secure authentication.
