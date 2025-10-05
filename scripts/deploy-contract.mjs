
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import solc from 'solc'
import { ethers } from 'ethers'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function compile() {
  const contractPath = path.join(process.cwd(), 'contracts', 'decentralized-storage.sol')
  const source = await readFile(contractPath, 'utf8')
  const input = {
    language: 'Solidity',
    sources: { 'DecentralizedStorage.sol': { content: source } },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  }
  const output = JSON.parse(solc.compile(JSON.stringify(input)))
  const contract = output.contracts['DecentralizedStorage.sol'].DecentralizedStorage
  if (!contract) throw new Error('Compilation failed: contract not found')
  return { abi: contract.abi, bytecode: '0x' + contract.evm.bytecode.object }
}

async function main() {
  const PRIVATE_KEY = process.env.PRIVATE_KEY
  const ALCHEMY_RPC_URL = process.env.ALCHEMY_RPC_URL
  if (!PRIVATE_KEY || !ALCHEMY_RPC_URL) {
    console.log('PRIVATE_KEY and/or ALCHEMY_RPC_URL is missing!')
    return
  }

  const { abi, bytecode } = await compile()
  const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_URL)
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

  console.log('deploying...')
  const factory = new ethers.ContractFactory(abi, bytecode, wallet)
  const contract = await factory.deploy()
  await contract.waitForDeployment()
  const address = await contract.getAddress()

  console.log('deployed DecentralizedStorage at:', address)
}

main().catch((e) => {
  console.log('error occurred in deploy-contract.mjs:', e.message)
})
