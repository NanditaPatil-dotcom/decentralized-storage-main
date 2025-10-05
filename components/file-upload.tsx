"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"

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
  const [jwt, setJwt] = useState("")
  const [uploading, setUploading] = useState(false)
  const [cid, setCid] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!userAddress) {
      toast({ title: "Connect your wallet first", variant: "destructive" })
      return
    }
    if (!file) {
      toast({ title: "No file selected", variant: "destructive" })
      return
    }
    if (!jwt.trim()) {
      toast({ title: "JWT required", description: "Please enter your Pinata JWT token", variant: "destructive" })
      return
    }

    try {
      setUploading(true)

      const form = new FormData()
      form.append("file", file, file.name)

      // Upload directly to Pinata using plain JWT
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        form,
        {
          headers: {
            "Authorization": `Bearer ${jwt}`,
          },
          timeout: 30000,
        }
      )

      const fileCid = response.data.IpfsHash
      setCid(fileCid)

      toast({ title: "File uploaded to IPFS", description: `CID: ${fileCid}` })

      // Reset form and redirect to dashboard for next upload
      setTimeout(() => {
        setFile(null)
        setJwt("")
        setCid(null)
        // Clear file input value
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        router.push("/dashboard")
      }, 2000) // Give user 2 seconds to see success message

    } catch (error: any) {
      console.error("Upload error:", error)

      let errorMessage = "Upload failed"
      if (error.response?.status === 403) {
        errorMessage = "Authentication failed. Check your Pinata JWT token."
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid JWT token. Check your token from Pinata Dashboard."
      }

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      })
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
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="pinata-jwt">Pinata JWT Token</Label>
        <Input
          id="pinata-jwt"
          type="password"
          placeholder="Enter your Pinata JWT token"
          value={jwt}
          onChange={(e) => setJwt(e.target.value)}
          disabled={uploading}
        />
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || !jwt.trim() || uploading}
      >
        {uploading ? "Uploading to Pinata…" : "Upload to Pinata"}
      </Button>

      {cid && (
        <div className="p-3 bg-black-50 border rounded-md">
          <p className="text-sm font-medium text-green-800 mb-2">File uploaded successfully!</p>
            </div>
      )}

      <p className="text-xs text-muted-foreground">
        Enter your Pinata JWT token and select a file to upload directly to Pinata.
      </p>
    </div>
  )
}
