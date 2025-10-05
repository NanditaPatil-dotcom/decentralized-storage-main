# Decentralized File Storage (Polygon Amoy)

A React + Next.js DApp that uploads files to IPFS via NFT.Storage and stores their CIDs on-chain using a Solidity contract deployed to Polygon Amoy (80002).

## Tech

- Next.js (App Router), Tailwind
- ethers.js + MetaMask
- IPFS via Pinata (server-side API key usage) (1 GB as free tier)
- Solidity contract for user => CID[] mapping

## To access your storage:
- create a wallet on Metamask
- select polygon almoy as the testnet
- pump the currency(POL) in the wallet for the gas
- depending on the wallet balance, the files get uploaded
- also, create your pinata account and add a new key
- enter the jwt key to the website (safe and encrypted)
- the jwt is received directly by pinata, no server involved

## codeflow:
1.User (Browser w/ MetaMask)
2.Frontend (React + ethers.js + Tailwind)
        |--> User selects file (Upload button)
        >
Backend API (Express/Node.js)
        |--> Receives file via POST /upload
        |--> Calls Pinata API with JWT
        >
Pinata (IPFS Storage)
        |--> Returns CID (Qm...123)
        >
Backend
        |--> Calls Smart Contract (Hardhat + Alchemy RPC)
               function uploadFile(CID)
        >
Polygon Amoy Testnet (Smart Contract)
        |--> Stores CID under user’s address
        >
Frontend (React)
        |--> Calls contract.getFiles(userAddress)
        |--> Gets CID list
        >
Pinata Gateway / IPFS
        |--> https://gateway.pinata.cloud/ipfs/<CID>
        >
User (Downloads/Views File)


