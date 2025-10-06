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

