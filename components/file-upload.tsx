"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/simple-toast"
import { addFile, addFileViaHttp } from "@/lib/helia-browser"
import { putFileDoc, validateAndSanitizeForIPLD } from "@/lib/orbitdb-browser"
import { useHelia } from "@/hooks/useHelia"

declare global {
  interface Window {
    ethereum?: any
  }
}

type Props = {
  userAddress: string | null
}

export function FileUpload({ userAddress }: Props) {
  const { ready, error: heliaError } = useHelia()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [cid, setCid] = useState<string | null>(null)
  const [folder, setFolder] = useState<string>("")
  const [tags, setTags] = useState<string>("")
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
    if (!okType && f.type) {
      // Allow unknown types but warn user; uncomment next line to hard-block
      // throw new Error("Unsupported file type")
    }
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
    if (!ready) {
      toast({ title: "IPFS node starting…", description: "Please wait a moment and try again." })
      return
    }

    try {
      setUploading(true)
      
      // Safety checks before processing
      if (!file || !file.name || file.size === undefined || file.size === null) {
        throw new Error("Invalid file data - missing name or size")
      }
      
      validateFile(file)

      // 1) Upload to IPFS via Helia (browser), fallback to HTTP client
      let fileCid = ""
      try {
        const bytes = new Uint8Array(await file.arrayBuffer())
        
        // Additional validation of bytes array
        if (!bytes || bytes.length === 0) {
          throw new Error("File appears to be empty or corrupted")
        }
        
        try {
          fileCid = await addFile(bytes)
        } catch (e) {
          fileCid = await addFileViaHttp(bytes)
        }
      } catch (e: any) {
        throw new Error(e?.message || "Failed to add file to IPFS (Helia)")
      }
      
      // Validate CID was generated
      if (!fileCid || typeof fileCid !== 'string') {
        throw new Error("Failed to generate valid CID for uploaded file")
      }
      
      setCid(fileCid)
      toast({ title: "File uploaded to IPFS", description: `CID: ${fileCid}` })

      // 2) Store metadata in OrbitDB
      try {
        // Create document with all required fields
        const rawDoc = {
          _id: `${userAddress}:${fileCid}`,
          wallet: userAddress,
          cid: fileCid,
          filename: file.name || "unknown",
          size: file.size || 0,
          mime: file.type || "application/octet-stream",
          createdAt: Date.now(),
          tags: tags.split(",").map(s => s.trim()).filter(Boolean),
          // Only add folder if it has a value
          ...(folder.trim() && { folder: folder.trim() })
        }
        
        // Validate and sanitize using utility function
        const safeDoc = validateAndSanitizeForIPLD(rawDoc, ['_id', 'wallet', 'cid', 'filename'])
        
        await putFileDoc(safeDoc)
      } catch (e: any) {
        throw new Error(e?.message || "Failed to store metadata in OrbitDB")
      }

      // Reset form and redirect to dashboard for next upload
      setTimeout(() => {
        setFile(null)
        setCid(null)
        setFolder("")
        setTags("")
        // Clear file input value
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        router.push("/dashboard")
      }, 2000) // Give user 2 seconds to see success message

    } catch (error: any) {
      console.error("Upload error:", error)
      toast({ title: "Upload failed", description: error?.message || "Unexpected error", variant: "destructive" })
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
        <p className="text-xs text-muted-foreground">Max 50MB. Images, PDF, and text are recommended.</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="folder">Folder (optional)</Label>
        <Input id="folder" value={folder} onChange={(e) => setFolder(e.target.value)} disabled={uploading} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} disabled={uploading} />
      </div>


      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? "Uploading…" : "Upload"}
      </Button>

      {cid && (
        <div className="p-3 bg-black-50 border rounded-md">
          <p className="text-sm font-medium text-green-800 mb-2">File uploaded successfully!</p>
            </div>
      )}
    </div>
  )
}
