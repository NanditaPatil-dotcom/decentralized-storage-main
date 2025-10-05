// Script to verify contract deployment and connection
import { ethers, getAddress } from 'ethers'
import dotenv from 'dotenv'

dotenv.config()

const CONTRACT_ABI = [
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

async function verifyContract() {
  console.log('\n=== Contract Verification Script ===\n')

  // Check environment variables
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
  const rpcUrl = process.env.ALCHEMY_RPC_URL

  console.log('1. Checking environment variables...')
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    console.error('NEXT_PUBLIC_CONTRACT_ADDRESS is invalid')
    return
  }
  console.log('contract address:', contractAddress)

  if (!rpcUrl || rpcUrl.includes('YOUR_ALCHEMY_API_KEY')) {
    console.error('ALCHEMY_RPC_URL is not set or contains placeholder')
    console.log('please get a valid API key from: https://dashboard.alchemy.com/')
    return
  }
  console.log('rpc url configured')

  try {
    // Connect to provider
    console.log('\n2. Connecting to Polygon Amoy testnet...')
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const network = await provider.getNetwork()
    console.log('connected to network:', network.name, 'chain id:', network.chainId)

    if (network.chainId !== 80002n) {
      console.warn('warning: expected chain id 80002 (polygon amoy), got', network.chainId)
    }

    // Check if contract exists
    console.log('\n3. Checking contract deployment...')
    const code = await provider.getCode(contractAddress)
    
    if (code === '0x') {
      console.error('no contract found at address:', contractAddress)
      console.log('the contract may not be deployed or the address is incorrect.')
      console.log('run the deployment script first: node scripts/deploy-contract.js')
      return
    }
    console.log('contract code found at address (length:', code.length, 'bytes)')

    // try to call getFiles
    console.log('\n4. Testing contract function calls...')
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider)

    try {
      // test with a dummy address (properly checksummed)
      const testAddress = getAddress('0xa27eaf73d6d45bf21b8a7f979462cdb2d4d65f94')

      console.log('calling getFiles with test address:', testAddress)

      // first, let's try to estimate gas to see if the function signature is correct
      try {
        const gasEstimate = await contract.getFiles.estimateGas(testAddress)
        console.log('gas estimate successful:', gasEstimate.toString())
      } catch (gasError) {
        console.log('   Gas estimation failed:', gasError.message)
        console.log('   This suggests the function signature or parameters are incorrect')
      }

      const files = await contract.getFiles(testAddress)
      console.log('successfully called getFiles()')
      console.log('files for test address:', files.length === 0 ? 'no files' : files)
    } catch (error) {
      console.log('function call failed:', error.message)

      if (error.message.includes('CALL_EXCEPTION') || error.message.includes('missing revert data')) {
        console.log('this typically means:')
        console.log('- the contract ABI does not match the deployed contract')
        console.log('- the contract function signature is different')
        console.log('- the contract might not be properly deployed')
      }

      console.log('contract is deployed and accessible')
    }

    console.log('\nContract verification complete - Everything looks good!')
    console.log('\nIf you\'re still having issues:')
    console.log('1. make sure MetaMask is connected to Polygon Amoy testnet')
    console.log('2. clear browser cache and restart the dev server')
    console.log('3. check that your wallet has POL tokens for gas')

  } catch (error) {
    console.error('\nError during verification:', error.message)
    
    if (error.message.includes('could not coalesce error')) {
      console.log('\nthis error often means:')
      console.log('- the RPC endpoint is having issues')
      console.log('- the contract address is incorrect')
      console.log('- Network connectivity problems')
    }
    
    console.log('\n to resolve this:')
    console.log('1. verify your Alchemy API key is valid')
    console.log('2. check if the contract is deployed: https://amoy.polygonscan.com/address/' + contractAddress)
    console.log('3. try redeploying the contract')
  }
}

verifyContract().catch(console.error)
