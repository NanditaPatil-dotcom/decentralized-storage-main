"use client"

import useSWR from "swr"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract"

declare global {
  interface Window {
    ethereum?: any
  }
}

type Props = {
  userAddress: string | null
}

async function fetchFiles(userAddress: string): Promise<string[]> {
  if (!window.ethereum) throw new Error("MetaMask not available")
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file.")
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

    console.log('Calling getFiles for address:', userAddress)
    console.log('Contract address:', CONTRACT_ADDRESS)

    const files: string[] = await contract.getFiles(userAddress)
    console.log('Raw result from contract:', files)
    return files
  } catch (error: any) {
    console.error('Contract call error:', error)

    if (error.code === 'BAD_DATA' || error.message.includes('could not decode result data')) {
      throw new Error(`Contract data decode error. Make sure you're connected to Polygon Amoy testnet and the contract is deployed correctly. Contract: ${CONTRACT_ADDRESS}`)
    }

    if (error.code === 'CALL_EXCEPTION') {
      throw new Error(`Contract call failed. Check if MetaMask is connected to Polygon Amoy testnet (Chain ID: 80002)`)
    }

    throw error
  }
}

export function FileList({ userAddress }: Props) {
  const { data, error, isLoading, mutate } = useSWR(
    userAddress ? ["files", userAddress] : null,
    () => fetchFiles(userAddress as string),
    { revalidateOnFocus: true },
  )

  if (!userAddress) {
    return <p className="text-sm text-muted-foreground">Connect your wallet to see your files.</p>
  }

  if (isLoading) {
    return (
      <div className="grid gap-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    )
  }

  if (error) {
    console.error('FileList error:', error)
    return (
      <div className="space-y-2">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800 mb-2">⚠️ Unable to load files</p>
          <p className="text-xs text-yellow-700">{(error as Error).message}</p>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">No files yet. Upload your first file!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground mb-2">
        {data.length} file{data.length !== 1 ? 's' : ''} uploaded
      </p>
      {data.map((cid, originalIdx) => {
        const reversedIdx = data.length - 1 - originalIdx
        const short = cid.length > 20 ? `${cid.slice(0, 10)}...${cid.slice(-8)}` : cid
        const isLatest = reversedIdx === data.length - 1 // Last item in original array is latest
        return (
          <div key={cid + originalIdx} className="flex items-center justify-between rounded-md border p-3">
            <div className="text-sm">
              <div className="flex items-center gap-2">
                <div className="font-medium">{short}</div>
                {isLatest && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Latest
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground break-all">{cid}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="secondary">
                <a href={`https://gateway.pinata.cloud/ipfs/${cid}`} target="_blank" rel="noreferrer">
                  View
                </a>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => mutate()}>
                Refresh
              </Button>
            </div>
          </div>
        )
      }).reverse()}
    </div>
  )
}
