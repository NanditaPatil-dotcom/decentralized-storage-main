"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract"
import { ethers } from "ethers"
import { hasEncryptedJWT } from "@/lib/jwt-crypto"
import { PinataKeyInput } from "@/components/pinata-key-input"

declare global {
  interface Window {
    ethereum?: any
  }
}

type Props = {
  userAddress: string | null
}

export function UploadFile({ userAddress }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [txPending, setTxPending] = useState(false)
  const [cid, setCid] = useState<string | null>(null)
  const [jwtConfigured, setJwtConfigured] = useState(false)
  const { toast } = useToast()

  // Auto-upload when both file and JWT are ready
  useEffect(() => {
    if (file && jwtConfigured && !uploading && !txPending && !cid) {
      // Automatically trigger upload when both file and JWT are configured
      handleUpload()
    }
  }, [file, jwtConfigured, uploading, txPending, cid])

  // Monitor JWT configuration status
  useEffect(() => {
    const checkJWT = () => {
      setJwtConfigured(hasEncryptedJWT())
    }

    checkJWT()
    const interval = setInterval(checkJWT, 1000) // Check every second
    return () => clearInterval(interval)
  }, [])

  async function handleUpload() {
    if (!userAddress) {
      toast({ title: "Connect your wallet first", variant: "destructive" })
      return
    }
    if (!file) {
      toast({ title: "No file selected", variant: "destructive" })
      return
    }

    // Get user's JWT from localStorage
    const userJwt = localStorage.getItem("pinata-jwt")
    if (!userJwt || !jwtConfigured) {
      toast({ title: "Pinata JWT required", description: "Please configure your Pinata JWT token first", variant: "destructive" })
      return
    }

    try {
      setUploading(true)
      const form = new FormData()
      form.append("file", file)
      form.append("jwt", userJwt)
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || "Upload failed")
      }
      const data = (await res.json()) as { cid: string }
      const fileCid = data.cid
      setCid(fileCid)
      toast({ title: "Uploaded to IPFS", description: fileCid })

      if (!window.ethereum) {
        throw new Error("MetaMask not available")
      }
      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        throw new Error("Contract address not configured")
      }
      setTxPending(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.uploadFile(fileCid)
      await tx.wait()
      toast({ title: "Saved on-chain", description: `CID stored for ${userAddress}` })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Something went wrong", variant: "destructive" })
    } finally {
      setUploading(false)
      setTxPending(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="file">Choose a file</Label>
        <Input
          id="file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={uploading || txPending}
        />
      </div>

      <div className="space-y-4 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-sm">Configure Pinata JWT</h3>
        <PinataKeyInput />
      </div>

      <Button onClick={handleUpload} disabled={!file || uploading || txPending || !jwtConfigured}>
        {uploading ? "Uploading to IPFS…" : txPending ? "Saving to blockchain…" : jwtConfigured ? "Upload to Pinata" : "Configure JWT First"}
      </Button>
      {cid && (
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm font-medium mb-2">File uploaded successfully!</p>
          <p className="text-xs text-muted-foreground mb-1">CID: {cid}</p>
          <a
            href={`https://gateway.pinata.cloud/ipfs/${cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline"
          >
            View on IPFS Gateway
          </a>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Select a file and configure your Pinata JWT. Once both are ready, click "Upload to Pinata" to upload your file directly to Pinata's storage. The returned CID will be written to the smart contract for your address.
      </p>
    </div>
  )
}
