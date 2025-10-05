/**
 * INTEGRATION GUIDE FOR JWT CRYPTO UTILITIES
 * ==========================================
 *
 * This guide shows how to integrate the JWT encryption utilities into your existing components
 * without rewriting them completely. The key principle is that JWTs are only decrypted in memory
 * during upload operations and never sent to your backend for storage.
 */

import { useJWTEncryption } from "@/lib/jwt-crypto"

// ============================================================================
// 1. UPDATING PINATA KEY INPUT COMPONENT
// ============================================================================
/*
In your PinataKeyInput component, modify the save/clear functionality:

```tsx
import { useJWTEncryption } from "@/lib/jwt-crypto"

export function PinataKeyInput() {
  const [passphrase, setPassphrase] = useState("")
  const [jwt, setJwt] = useState("")
  const { encryptAndSaveJWT, clearJWTStorage, hasEncryptedJWT } = useJWTEncryption()

  // Check if encrypted JWT exists on component mount
  useEffect(() => {
    setHasStoredJWT(hasEncryptedJWT())
  }, [])

  const handleEncryptAndSave = async () => {
    if (!passphrase.trim() || !jwt.trim()) {
      toast({ title: "Passphrase and JWT required", variant: "destructive" })
      return
    }

    const success = await encryptAndSaveJWT(jwt, passphrase)
    if (success) {
      setJwt("") // Clear JWT from memory
      setPassphrase("") // Clear passphrase from memory
      setHasStoredJWT(true)
    }
  }

  const handleClearStorage = () => {
    clearJWTStorage()
    setHasStoredJWT(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="jwt">Pinata JWT Token</Label>
        <Input
          id="jwt"
          type="password"
          value={jwt}
          onChange={(e) => setJwt(e.target.value)}
          placeholder="Enter your JWT token"
        />
      </div>
      <div>
        <Label htmlFor="passphrase">Encryption Passphrase</Label>
        <Input
          id="passphrase"
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Choose a strong passphrase"
        />
        <p className="text-xs text-muted-foreground mt-1">
          This passphrase encrypts your JWT locally. Remember it - you can't recover your JWT without it!
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleEncryptAndSave}>
          Encrypt & Save JWT
        </Button>
        <Button variant="outline" onClick={handleClearStorage}>
          Clear Stored JWT
        </Button>
      </div>
    </div>
  )
}
```
*/

// ============================================================================
// 2. UPDATING UPLOAD FILE COMPONENT
// ============================================================================
/*
In your UploadFile component, modify the upload logic to decrypt JWT in memory:

```tsx
import { useJWTEncryption } from "@/lib/jwt-crypto"

export function UploadFile({ userAddress }: Props) {
  const [passphrase, setPassphrase] = useState("")
  const [showPassphrasePrompt, setShowPassphrasePrompt] = useState(false)
  const { decryptJWTForUpload } = useJWTEncryption()

  async function handleUpload() {
    if (!userAddress) {
      toast({ title: "Connect wallet first", variant: "destructive" })
      return
    }

    if (!file) {
      toast({ title: "No file selected", variant: "destructive" })
      return
    }

    if (!hasEncryptedJWT()) {
      setShowPinataInput(true)
      toast({ title: "JWT required", description: "Configure your Pinata JWT first", variant: "destructive" })
      return
    }

    if (!passphrase.trim()) {
      setShowPassphrasePrompt(true)
      toast({ title: "Passphrase required", description: "Enter your encryption passphrase", variant: "destructive" })
      return
    }

    try {
      setUploading(true)

      // Decrypt JWT in memory only for this upload
      const jwt = await decryptJWTForUpload(passphrase)
      if (!jwt) {
        return // Error already shown by decryptJWTForUpload
      }

      // JWT exists only in memory during this scope
      const form = new FormData()
      form.append("file", file)
      form.append("jwt", jwt) // Send to backend for immediate use

      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || "Upload failed")
      }

      const data = await res.json()
      const cid = data.cid
      setCid(cid)
      toast({ title: "Upload successful", description: cid })

      // After upload, JWT is discarded from memory
      // Passphrase should also be cleared
      setPassphrase("")
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Upload failed", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {showPassphrasePrompt && (
        <div className="space-y-2">
          <Label htmlFor="passphrase">Encryption Passphrase</Label>
          <Input
            id="passphrase"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Enter your passphrase to decrypt JWT"
          />
          <Button onClick={handleUpload} disabled={!passphrase.trim()}>
            Decrypt & Upload
          </Button>
        </div>
      )}
      {/* Rest of your upload component */}
    </div>
  )
}
```
*/

// ============================================================================
// 3. SECURITY CONSIDERATIONS & WARNINGS
// ============================================================================
/*
1. PASSPHRASE MANAGEMENT:
   - Passphrases should be strong (12+ characters, mixed case, numbers, symbols)
   - Never store passphrases - require user input each time
   - Warn users that lost passphrases mean lost access to encrypted JWTs
   - Consider implementing passphrase strength checking

2. XSS PROTECTION:
   - This encryption protects against localStorage theft but not XSS attacks
   - Malicious scripts could potentially steal passphrases from memory
   - Consider using Content Security Policy (CSP) headers
   - Warn users about browser security and avoiding malicious websites

3. BACKUP & RECOVERY:
   - Users should backup their passphrases securely (password manager, written down)
   - Consider providing export functionality for encrypted JWT backup
   - Warn that without the passphrase, JWTs cannot be recovered

4. STORAGE LIMITATIONS:
   - localStorage has size limits (typically 5-10MB)
   - Large numbers of encrypted JWTs could exceed limits
   - Consider implementing cleanup for old/expired tokens

5. PERFORMANCE CONSIDERATIONS:
   - Key derivation (PBKDF2) is computationally expensive
   - Multiple decryption operations may impact UX
   - Consider caching derived keys briefly (but clear them after use)

6. ALTERNATIVE SECURITY MODELS:
   - For higher security, consider hardware security keys
   - WebAuthn could provide better protection than passphrases
   - Consider server-side encryption for enterprise applications

7. COMPLIANCE & LEGAL:
   - Ensure encryption implementation meets relevant security standards
   - Be transparent about encryption strength and limitations
   - Consider GDPR/data protection implications of storing encrypted tokens

8. USER EDUCATION:
   - Provide clear warnings about security limitations
   - Explain what protection this provides and what it doesn't
   - Include help text about secure passphrase creation
   - Show visual indicators when JWT is encrypted vs unencrypted
*/

// ============================================================================
// 4. SAMPLE WARNING MESSAGES FOR UI
// ============================================================================
/*
Add these warnings to your UI to educate users:

<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
  <div className="flex">
    <AlertTriangle className="h-5 w-5 text-yellow-400" />
    <div className="ml-3">
      <h3 className="text-sm font-medium text-yellow-800">
        Security Notice
      </h3>
      <div className="mt-2 text-sm text-yellow-700">
        <p>
          Your JWT is encrypted locally using your passphrase. However:
        </p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>This protects against casual theft but not determined attackers</li>
          <li>Lost passphrases cannot be recovered</li>
          <li>Browser security vulnerabilities could compromise your passphrase</li>
          <li>Never share your passphrase with anyone</li>
        </ul>
      </div>
    </div>
  </div>
</div>
*/

// ============================================================================
// 5. TESTING YOUR INTEGRATION
// ============================================================================
/*
1. Test passphrase requirements (empty, weak passphrases)
2. Test JWT format validation
3. Test encryption/decryption with same passphrase
4. Test decryption failure with wrong passphrase
5. Test localStorage persistence across browser sessions
6. Verify JWT is cleared from memory after upload
7. Test error handling for localStorage failures
8. Test with various JWT lengths and special characters
*/

export {} // Make this a module
