"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useJWTEncryption, hasEncryptedJWT as checkEncryptedJWT } from "@/lib/jwt-crypto"

export function PinataKeyInput() {
  const [jwt, setJwt] = useState("")
  const [saved, setSaved] = useState(false)
  const { toast } = useToast()
  const { encryptAndSaveJWT, clearJWTStorage } = useJWTEncryption()

  // Check if encrypted JWT exists on component mount
  useEffect(() => {
    setSaved(checkEncryptedJWT())
  }, [])

  const handleSave = async () => {
    if (!jwt.trim()) {
      toast({ title: "Please enter a valid JWT token", variant: "destructive" })
      return
    }

    // Basic JWT format validation (should start with eyJ)
    if (!jwt.startsWith("eyJ")) {
      toast({ title: "Invalid JWT format", description: "JWT should start with 'eyJ'", variant: "destructive" })
      return
    }

    // Generate a random passphrase internally
    const internalPassphrase = crypto.randomUUID()
    
    const success = await encryptAndSaveJWT(jwt, internalPassphrase)
    if (success) {
      setJwt("") // Clear JWT from memory
      setSaved(true) // Update state to reflect successful save
    }
  }

  const handleClear = () => {
    clearJWTStorage()
    setSaved(false)
    toast({ title: "JWT cleared", description: "Your encrypted JWT has been removed" })
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Input
          id="pinata-jwt"
          type="password"
          placeholder="Enter your Pinata JWT token"
          value={jwt}
          onChange={(e) => setJwt(e.target.value)}
        />
        <p className="text-xs text-muted-foreground line-clamp-2">
          Your JWT is encrypted and secured.
          Get your JWT from{" "}
          <a
            href="https://app.pinata.cloud/developers/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Pinata Dashboard
          </a>
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!jwt.trim()} className="p-4 bg-white border rounded-lg text-sm text-black text-center font-medium">
          {saved ? "Update JWT" : "Save JWT"}
        </Button>
        {saved && (
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
