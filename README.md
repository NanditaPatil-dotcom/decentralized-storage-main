
##  Overview

**Decentralised Storage** is a decentralized file storage web application that allows users to securely upload, store, and retrieve files using blockchain technology.
Authentication is handled by **MetaMask**, file storage is powered by **Filebase (IPFS)**, and the **Ethereum Sepolia Testnet** ensures on-chain proof of ownership and file persistence.

In simple terms: You own your files, and no centralized entity can take them down.

---

## How It Works

### Architecture Flow

```
User  
  ↓
Frontend (Next.js + ethers.js)  
  ↓
Filebase/IPFS ← stores actual files  
  ↓
Ethereum Smart Contract ← stores file CIDs and links them to wallet addresses
```

### 🔍 Step-by-Step Process

1. **User Authentication:**

   * The user connects their **MetaMask wallet**.
   * The dApp verifies their wallet address (no passwords required).

2. **File Upload:**

   * The user uploads a file.
   * The file is stored on **Filebase**, which uses the **InterPlanetary File System (IPFS)** to distribute file chunks across decentralized nodes.
   * IPFS returns a unique **CID (Content Identifier)** representing that file.

3. **Smart Contract Interaction:**

   * The CID is sent to a deployed **Ethereum smart contract**, where it is mapped to the user’s wallet address.
   * This ensures that the file’s ownership and history are recorded **on-chain**, making it verifiable and immutable.

4. **File Retrieval:**

   * When the user logs in again, the app fetches all CIDs linked to their wallet from the contract.
   * Each CID is used to fetch the file from IPFS/Filebase, reconstructing it for viewing or download.

---

## Tech Stack

* **Frontend:** Next.js, Tailwind CSS, Ethers.js
* **Blockchain:** Solidity (Ethereum Sepolia Testnet)
* **Storage:** Filebase (IPFS)
* **Wallet Integration:** MetaMask
* **Hosting:** Vercel

---

## Ethereum Sepolia Network Configuration

| Field              | Value                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| **Network Name**   | Ethereum Sepolia                                                            |
| **RPC URL**        | Your configured Sepolia RPC endpoint                                        |
| **Chain ID**       | 11155111                                                                     |
| **Currency**       | ETH                                                                          |
| **Block Explorer** | [https://sepolia.etherscan.io](https://sepolia.etherscan.io)               |



