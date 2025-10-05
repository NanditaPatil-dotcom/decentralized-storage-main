"use client"

import CryptoJS from 'crypto-js'

// JWT Helper Functions
// Note: These functions provide OPTIONAL encrypted storage for user convenience
// The JWT is ALWAYS decrypted back to plain text before sending to Pinata API
// SECURITY: Encrypted storage is optional; JWT in memory is plain when uploading

export function encryptJWT(jwt: string, passphrase: string): string {
  // Encrypt JWT for local storage (optional convenience feature)
  return CryptoJS.AES.encrypt(jwt, passphrase).toString()
}

export function decryptJWT(encryptedJWT: string, passphrase: string): string {
  // Decrypt JWT back to plain text for API use
  const bytes = CryptoJS.AES.decrypt(encryptedJWT, passphrase)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function saveJWTLocally(jwt: string): boolean {
  try {
    // Generate a random passphrase for encryption
    const passphrase = crypto.randomUUID()

    // Encrypt JWT for local storage
    const encryptedJWT = encryptJWT(jwt, passphrase)

    // Store both encrypted JWT and passphrase
    localStorage.setItem('pinata-jwt-encrypted', encryptedJWT)
    localStorage.setItem('pinata-jwt-passphrase', passphrase)

    return true
  } catch (error) {
    console.error('Failed to save JWT locally:', error)
    return false
  }
}

export function getJWTLocally(): string | null {
  try {
    const encryptedJWT = localStorage.getItem('pinata-jwt-encrypted')
    const passphrase = localStorage.getItem('pinata-jwt-passphrase')

    if (!encryptedJWT || !passphrase) {
      return null
    }

    // Decrypt JWT back to plain text for API use
    return decryptJWT(encryptedJWT, passphrase)
  } catch (error) {
    console.error('Failed to retrieve JWT locally:', error)
    return null
  }
}

export function clearJWTLocally(): void {
  localStorage.removeItem('pinata-jwt-encrypted')
  localStorage.removeItem('pinata-jwt-passphrase')
}

export function hasStoredJWT(): boolean {
  return localStorage.getItem('pinata-jwt-encrypted') !== null
}
