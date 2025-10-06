"use client"

// Simple AES-GCM helper for optional client-side encryption

export async function deriveKey(password: string, salt: Uint8Array) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
  return key
}

export async function encryptBytes(plain: Uint8Array, password: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(password, salt)
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plain
  )
  return { cipher: new Uint8Array(cipherBuf), iv, salt }
}

export async function decryptBytes(cipher: Uint8Array, password: string, iv: Uint8Array, salt: Uint8Array) {
  const key = await deriveKey(password, salt)
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipher
  )
  return new Uint8Array(plainBuf)
}


