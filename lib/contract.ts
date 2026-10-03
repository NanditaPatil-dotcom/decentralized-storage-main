import { ethers } from "ethers"
import ContractABI from "../abis/DecentralizedStorage.json"

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL

/**
 * Get a read-only contract (uses JsonRpcProvider) or a signer-backed contract (MetaMask)
 * providerOrSigner - ethers provider OR signer
 */
export function getContractWithProvider(providerOrSigner: ethers.Provider | ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS!, ContractABI, providerOrSigner)
}

/**
 * Get read-only contract using RPC provider (useful for preloads)
 */
export function getReadOnlyContract() {
  if (!RPC_URL) throw new Error("NEXT_PUBLIC_RPC_URL must be configured for Ethereum Sepolia")
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  return getContractWithProvider(provider)
}

/**
 * Call this after upload (frontend): sends tx with signer (MetaMask)
 * returns txResponse
 */
export async function uploadCidOnChain(cid: string) {
  if (!window.ethereum) throw new Error("No wallet found (MetaMask)")
  await window.ethereum.request({ method: "eth_requestAccounts" })
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const contract = getContractWithProvider(signer)

  // Check if contract is deployed
  const code = await provider.getCode(CONTRACT_ADDRESS!)
  if (code === '0x') {
    throw new Error("Contract not deployed at the specified address")
  }

  // send transaction
  const tx = await contract.uploadFile(cid)
  return tx
}

/**
 * Read files for address (returns string[] of CIDs)
 */
export async function getFilesForAddress(address: string): Promise<string[]> {
  const contract = getReadOnlyContract()
  const files = await contract.getFiles(address)
  // sometimes contract returns bytes or string arrays; normalize:
  return files.map((f: any) => f.toString())
}
