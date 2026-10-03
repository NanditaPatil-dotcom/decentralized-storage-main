"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/simple-toast"
import { uploadToServer } from "@/lib/server-upload"
import { Progress } from "@/components/ui/progress"
import { uploadCidOnChain } from "@/lib/contract"

declare global {
  interface Window {
    ethereum?: any
  }
}

type Props = {
  userAddress: string | null
}

export function FileUpload({ userAddress }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [cid, setCid] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [status, setStatus] = useState<string>("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
  const ACCEPTED_TYPES = [
    "image/",
    "application/pdf",
    "text/plain",
  ]

  function validateFile(f: File) {
    // Comprehensive file validation
    if (!f) {
      throw new Error("No file provided")
    }
    if (!f.name || f.name.trim().length === 0) {
      throw new Error("File must have a valid name")
    }
    if (f.size === undefined || f.size === null) {
      throw new Error("File size is undefined")
    }
    if (f.size === 0) {
      throw new Error("File cannot be empty")
    }
    if (f.size > MAX_SIZE_BYTES) {
      throw new Error("File too large (max 50MB)")
    }
    
    // Type validation (warning only for now)
    const okType = ACCEPTED_TYPES.some((t) => t.endsWith("/") ? f.type.startsWith(t) : f.type === t)
  }

  const handleUpload = async () => {
    // Browser environment check
    if (typeof window === "undefined") {
      toast({ title: "Upload failed", description: "Not in browser environment", variant: "destructive" })
      return
    }

    if (!userAddress) {
      toast({ title: "Connect your wallet first", variant: "destructive" })
      return
    }
    if (!file) {
      toast({ title: "No file selected", variant: "destructive" })
      return
    }

    try {
      setUploading(true)
      setProgress(0)
      
      // Safety checks before processing
      if (!file || !file.name || file.size === undefined || file.size === null) {
        throw new Error("Invalid file data - missing name or size")
      }
      
      validateFile(file)

      // Server-side upload via Filebase S3
      try {
        const result = await uploadToServer(file, userAddress, (p) => setProgress(p))
        const cidFromServer = (result.CID || (result as any).cid || null)
        if (!cidFromServer) {
          throw new Error("Server did not return a CID")
        }
        setCid(cidFromServer)
        toast({
          title: "File uploaded to storage",
          description: `CID: ${cidFromServer}`
        })
        setStatus("Recording CID on-chain...")

        // Record CID on-chain
        const tx = await uploadCidOnChain(cidFromServer)
        setTxHash(tx.hash)
        setStatus("Waiting for transaction confirmation...")
        setUploading(true) // Keep uploading true for tx wait
        await tx.wait(1)
        setStatus("Transaction confirmed")
        setUploading(false)

        toast({
          title: "CID recorded on-chain",
          description: `Transaction: ${tx.hash}`
        })

        // Notify server-file-list to refresh
        try {
          window.dispatchEvent(new CustomEvent("server-upload-complete", { detail: { walletAddress: userAddress, CID: cidFromServer, fileName: file.name, timestamp: new Date().toISOString() } }))
        } catch {}
        setProgress(100)
      } catch (e: any) {
        throw new Error(e?.message || "Failed to upload to server")
      }

      // Reset form and redirect to dashboard for next upload
      setTimeout(() => {
        setFile(null)
        setCid(null)
        setStatus("")
        setTxHash(null)
        // Clear file input value
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        router.push("/dashboard")
      }, 2000) // Give user 2 seconds to see success message

    } catch (error: any) {
      console.error("Upload error:", error)
      let errorMessage = error?.message || "Unexpected error"
      if (errorMessage.toLowerCase().includes("insufficient funds") || errorMessage.toLowerCase().includes("gas")) {
        errorMessage = "Insufficient funds for transaction. Please get Sepolia ETH from a testnet faucet."
      }
      toast({ title: "Upload failed", description: errorMessage, variant: "destructive" })
      setTxHash(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="file">Choose a file</Label>
        <Input
          id="file"
          type="file"
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={uploading}
          placeholder="Browse... No file selected..."
        />
        <p className="text-xs text-muted-foreground">Max 50MB. Images, PDF, and text are recommended.</p>
      </div>


      {uploading && (
        <div className="grid gap-2">
          <Label>Upload progress</Label>
          <Progress value={progress} />
          <div className="text-xs text-muted-foreground">{progress}%</div>
          {status && <p className="text-sm text-blue-600">{status}</p>}
          {txHash && (
            <p className="text-sm text-blue-600">
              Transaction: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline">{txHash.slice(0, 10)}...{txHash.slice(-8)}</a>
            </p>
          )}
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
      >
        {uploading ? `Uploading… ${progress}%` : `Upload`}
      </Button>

      {cid && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm font-medium text-green-800 mb-2">File uploaded successfully!</p>
          <p className="text-xs break-all">CID: {cid}</p>
        </div>
      )}
    </div>
  )
}
