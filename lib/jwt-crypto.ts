/**
 * JWT Encryption/Decryption Utility Module
 *
 * This module provides secure encryption/decryption of JWT tokens using Web Crypto API (AES-GCM)
 * with passphrase-based key derivation. The encrypted JWT is stored in localStorage and
 * decrypted only in memory during upload operations.
 *
 * SECURITY WARNINGS:
 * - The passphrase is never stored and must be provided by the user each time
 * - Encrypted JWT is stored locally but can be decrypted by anyone with the passphrase
 * - This provides protection against casual theft but not against determined attackers
 * - XSS attacks could potentially steal the passphrase from memory
 * - Consider using a more secure storage mechanism for production applications
 */

import { useToast } from "@/hooks/use-toast"

// Types for better type safety
interface JWTCryptoResult {
  success: boolean
  data?: string
  error?: string
}

interface JWTCryptoConfig {
  algorithm: 'AES-GCM'
  keyLength: 256
  ivLength: 12 // 96 bits for GCM
  tagLength: 128 // 128 bits for GCM
}

/**
 * Derives a cryptographic key from a passphrase using PBKDF2
 * @param passphrase - User's passphrase
 * @param salt - Random salt (should be stored with encrypted data)
 * @returns Promise<CryptoKey> - Derived key for AES-GCM
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // OWASP recommended minimum
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Generates a random salt for key derivation
 * @returns Uint8Array - Random 16-byte salt
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

/**
 * Generates a random IV for AES-GCM encryption
 * @returns Uint8Array - Random 12-byte IV
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12))
}

/**
 * Encrypts a JWT token using AES-GCM with passphrase-derived key
 * @param jwt - The JWT token to encrypt
 * @param passphrase - User's passphrase for encryption
 * @returns Promise<JWTCryptoResult> - Contains encrypted data or error
 */
export async function encryptJWT(jwt: string, passphrase: string): Promise<JWTCryptoResult> {
  try {
    if (!jwt || !passphrase) {
      return { success: false, error: 'JWT and passphrase are required' }
    }

    // Validate JWT format (basic check)
    if (!jwt.startsWith('eyJ')) {
      return { success: false, error: 'Invalid JWT format' }
    }

    const salt = generateSalt()
    const iv = generateIV()
    const key = await deriveKey(passphrase, salt)

    const encoder = new TextEncoder()
    const data = encoder.encode(jwt)

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      key,
      data
    )

    // Combine salt, IV, and encrypted data for storage
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(encrypted), salt.length + iv.length)

    // Convert to base64 for localStorage storage
    const encryptedBase64 = btoa(String.fromCharCode(...combined))

    return {
      success: true,
      data: encryptedBase64
    }
  } catch (error) {
    console.error('JWT encryption failed:', error)
    return {
      success: false,
      error: 'Encryption failed. Please try again.'
    }
  }
}

/**
 * Decrypts a JWT token using AES-GCM with passphrase-derived key
 * @param encryptedData - Base64 encoded encrypted JWT from localStorage
 * @param passphrase - User's passphrase for decryption
 * @returns Promise<JWTCryptoResult> - Contains decrypted JWT or error
 */
export async function decryptJWT(encryptedData: string, passphrase: string): Promise<JWTCryptoResult> {
  try {
    if (!encryptedData || !passphrase) {
      return { success: false, error: 'Encrypted data and passphrase are required' }
    }

    // Convert from base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(char => char.charCodeAt(0))
    )

    // Extract salt, IV, and encrypted data
    const saltLength = 16
    const ivLength = 12

    const salt = combined.slice(0, saltLength)
    const iv = combined.slice(saltLength, saltLength + ivLength)
    const encrypted = combined.slice(saltLength + ivLength)

    const key = await deriveKey(passphrase, salt)

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      key,
      encrypted
    )

    const decoder = new TextDecoder()
    const jwt = decoder.decode(decrypted)

    // Validate decrypted JWT format
    if (!jwt.startsWith('eyJ')) {
      return { success: false, error: 'Invalid JWT format after decryption' }
    }

    return {
      success: true,
      data: jwt
    }
  } catch (error) {
    console.error('JWT decryption failed:', error)
    return {
      success: false,
      error: 'Decryption failed. Please check your passphrase and try again.'
    }
  }
}

/**
 * Saves encrypted JWT to localStorage
 * @param encryptedJWT - Base64 encoded encrypted JWT
 * @returns boolean - Success status
 */
export function saveEncryptedJWT(encryptedJWT: string): boolean {
  try {
    localStorage.setItem('pinata-jwt-encrypted', encryptedJWT)
    return true
  } catch (error) {
    console.error('Failed to save encrypted JWT to localStorage:', error)
    return false
  }
}

/**
 * Retrieves and decrypts JWT from localStorage
 * @param passphrase - User's passphrase for decryption
 * @returns Promise<JWTCryptoResult> - Contains decrypted JWT or error
 */
export async function getDecryptedJWT(passphrase: string): Promise<JWTCryptoResult> {
  try {
    const encryptedData = localStorage.getItem('pinata-jwt-encrypted')
    if (!encryptedData) {
      return { success: false, error: 'No encrypted JWT found in localStorage' }
    }

    return await decryptJWT(encryptedData, passphrase)
  } catch (error) {
    console.error('Failed to retrieve JWT from localStorage:', error)
    return {
      success: false,
      error: 'Failed to retrieve JWT from localStorage'
    }
  }
}

/**
 * Clears encrypted JWT from localStorage
 * @returns boolean - Success status
 */
export function clearEncryptedJWT(): boolean {
  try {
    localStorage.removeItem('pinata-jwt-encrypted')
    return true
  } catch (error) {
    console.error('Failed to clear encrypted JWT from localStorage:', error)
    return false
  }
}

/**
 * Checks if encrypted JWT exists in localStorage
 * @returns boolean - True if encrypted JWT exists
 */
export function hasEncryptedJWT(): boolean {
  return localStorage.getItem('pinata-jwt-encrypted') !== null
}

/**
 * Hook for managing encrypted JWT in React components
 * Provides easy-to-use functions for encryption/decryption operations
 */
export function useJWTEncryption() {
  const { toast } = useToast()

  const encryptAndSaveJWT = async (jwt: string, passphrase: string): Promise<boolean> => {
    const result = await encryptJWT(jwt, passphrase)
    if (result.success && result.data) {
      const saved = saveEncryptedJWT(result.data)
      if (saved) {
        toast({
          title: "JWT encrypted and saved",
          description: "Your JWT has been securely encrypted and stored locally"
        })
        return true
      } else {
        toast({
          title: "Failed to save encrypted JWT",
          description: "Encryption succeeded but localStorage save failed",
          variant: "destructive"
        })
        return false
      }
    } else {
      toast({
        title: "Encryption failed",
        description: result.error || "Failed to encrypt JWT",
        variant: "destructive"
      })
      return false
    }
  }

  const decryptJWTForUpload = async (passphrase: string): Promise<string | null> => {
    const result = await getDecryptedJWT(passphrase)
    if (result.success && result.data) {
      toast({
        title: "JWT decrypted",
        description: "JWT decrypted for upload (exists in memory only)"
      })
      return result.data
    } else {
      toast({
        title: "Decryption failed",
        description: result.error || "Failed to decrypt JWT for upload",
        variant: "destructive"
      })
      return null
    }
  }

  const clearJWTStorage = (): boolean => {
    const cleared = clearEncryptedJWT()
    if (cleared) {
      toast({
        title: "JWT cleared",
        description: "Encrypted JWT has been removed from localStorage"
      })
      return true
    } else {
      toast({
        title: "Failed to clear JWT",
        description: "Failed to remove encrypted JWT from localStorage",
        variant: "destructive"
      })
      return false
    }
  }

  return {
    encryptAndSaveJWT,
    decryptJWTForUpload,
    clearJWTStorage,
    hasEncryptedJWT: hasEncryptedJWT()
  }
}
