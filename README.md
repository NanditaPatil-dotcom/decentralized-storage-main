# Decentralized File Storage (Polygon Amoy)

A React + Next.js DApp that uploads files to IPFS and stores their CIDs on-chain using a Solidity contract deployed to Polygon Amoy (80002).

## Tech

- Next.js (App Router), Tailwind
- ethers.js + MetaMask
- IPFS via Helia (no custodial pinning, runs in-browser)
- Solidity contract for user => CID[] mapping

## To access your storage

1. Create a wallet on MetaMask  
2. Select Polygon Amoy as the testnet  
3. Add POL test tokens for gas  
4. Depending on your wallet balance, files will be uploaded  

## Code Flow

```text
User (Browser w/ MetaMask)
   ↓
Frontend (React + ethers.js + Tailwind)
   └──> User selects file (Upload button)
        ↓
Backend API (Express/Node.js)
   └──> Receives file via POST /upload
        └──> Adds file to IPFS via Helia (in browser)
             ↓
IPFS (Helia / public gateways)
   └──> Returns CID (Qm...123)
        ↓
Backend
   └──> Calls Smart Contract (Hardhat + Alchemy RPC)
        └──> function uploadFile(CID)
             ↓
Polygon Amoy Testnet (Smart Contract)
   └──> Stores CID under user’s address
        ↓
Frontend (React)
   └──> Calls contract.getFiles(userAddress)
        └──> Gets CID list
             ↓
IPFS
   └──> https://ipfs.io/ipfs/<CID>
        ↓
User (Downloads/Views File)
