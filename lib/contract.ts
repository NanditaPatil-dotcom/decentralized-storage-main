// IMPORTANT: Set NEXT_PUBLIC_CONTRACT_ADDRESS in your project's Environment Variables.
// Example: 0xYourDeployedContractAddressOnAmoy
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000"

// ABI compiled from the provided Solidity contract
export const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "string", name: "cid", type: "string" }],
    name: "uploadFile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getFiles",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "string", name: "cid", type: "string" },
    ],
    name: "FileUploaded",
    type: "event",
  },
]
