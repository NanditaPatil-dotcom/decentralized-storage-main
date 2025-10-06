"use client"

// Note: dynamic import of @orbitdb/core in getOrbitDB to avoid SSR/native load
import { getBrowserHelia } from "@/lib/helia-browser"

// Browser polyfills for Node.js APIs that OrbitDB expects
if (typeof window !== "undefined") {
  // Polyfill process.nextTick if not available
  if (!window.process) {
    (window as any).process = {
      nextTick: (callback: Function, ...args: any[]) => {
        setTimeout(() => callback(...args), 0)
      },
      env: { NODE_ENV: 'development' }
    }
  }
  
  // Polyfill setImmediate if not available
  if (!window.setImmediate) {
    (window as any).setImmediate = (callback: Function, ...args: any[]) => {
      return setTimeout(() => callback(...args), 0)
    }
    ;(window as any).clearImmediate = clearTimeout
  }
}

type FileDoc = {
  _id: string
  wallet: string
  cid: string
  filename: string
  size: number
  mime: string
  createdAt: number
  folder?: string
  tags?: string[]
  encrypted?: boolean
  encAlgo?: string
}

let orbitSingleton: Promise<{ orbitdb: any }> | null = null
let filesStoreSingleton: Promise<any> | null = null

export async function getOrbitDB() {
  if (orbitSingleton) return orbitSingleton
  orbitSingleton = (async () => {
    // Ensure we're in browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error("OrbitDB must run in browser environment")
    }
    
    // Wait for DOM to be completely ready
    await new Promise<void>((resolve) => {
      if (document.readyState === "complete") {
        resolve()
      } else {
        const checkReady = () => {
          if (document.readyState === "complete") {
            resolve()
          } else {
            setTimeout(checkReady, 50)
          }
        }
        setTimeout(checkReady, 50)
      }
    })
    
    // Additional delay to ensure all browser APIs are stable
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const { helia } = await getBrowserHelia()
    const { createOrbitDB } = await import("@orbitdb/core")
    
    // Create OrbitDB with browser-safe configuration
    const orbitdb = await createOrbitDB({ 
      ipfs: helia,
      // Disable automatic sync to prevent EventEmitter issues
      sync: false
    })
    return { orbitdb }
  })()
  return orbitSingleton
}

function dbName() {
  const env = typeof process !== "undefined" ? (process.env.NODE_ENV || "development") : "development"
  return `files-${env}`
}

export async function getFilesStore() {
  if (filesStoreSingleton) return filesStoreSingleton
  filesStoreSingleton = (async () => {
    const { orbitdb } = await getOrbitDB()
    try {
      // Documents store indexed by _id; each doc contains wallet + cid + metadata
      const store = await orbitdb.open(dbName(), {
        type: "documents",
        indexBy: "_id",
        // Disable sync to prevent addEventListener errors
        sync: false,
        // Set minimal replication options
        replicationConcurrency: 1
      })
      // OrbitDB stores are ready to use immediately after opening
      // No need to call .load() - it's not available in newer OrbitDB versions
      return store
    } catch (e) {
      console.warn('Primary store creation failed, trying fallback:', e)
      // If opening/loading fails (e.g., corrupted local state), try recreating under a namespaced name
      const fallbackName = `${dbName()}-fallback-${Date.now()}`
      try {
        const store = await orbitdb.open(fallbackName, {
          type: "documents",
          indexBy: "_id",
          sync: false,
          replicationConcurrency: 1
        })
        // Store is ready to use immediately after opening
        return store
      } catch (fallbackError) {
        console.error('Both primary and fallback store creation failed:', fallbackError)
        throw new Error('Failed to create OrbitDB store. This might be a browser compatibility issue.')
      }
    }
  })()
  return filesStoreSingleton
}

export async function putFileDoc(doc: FileDoc) {
  // Validate and sanitize document using utility function
  const safeDoc = validateAndSanitizeForIPLD(doc, ['_id', 'wallet', 'cid', 'filename'])
  
  const store = await getFilesStore()
  // If doc exists, this will update it since _id is the index key
  await store.put(safeDoc)
}

export async function deleteFileDoc(id: string) {
  const store = await getFilesStore()
  await store.del(id)
}

export async function listFilesByWallet(wallet: string) {
  const store = await getFilesStore()
  const lower = wallet.toLowerCase()
  return store.query((d) => d.wallet?.toLowerCase() === lower)
}

// Utility function to validate and sanitize data for IPLD storage
export function validateAndSanitizeForIPLD(data: any, requiredFields: string[] = []): any {
  if (!data || typeof data !== 'object') {
    throw new Error('Data must be a valid object')
  }
  
  // Check for required fields
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Required field '${field}' is missing or empty`)
    }
  }
  
  // Use JSON parse/stringify to strip undefined values
  const sanitized = JSON.parse(JSON.stringify(data))
  
  // Verify sanitization didn't remove critical fields
  for (const field of requiredFields) {
    if (!sanitized[field]) {
      throw new Error(`Critical field '${field}' was lost during sanitization`)
    }
  }
  
  return sanitized
}

// Utility function to reset OrbitDB state in case of persistent errors
export async function resetOrbitDB() {
  try {
    // Clear singletons to force re-initialization
    orbitSingleton = null
    filesStoreSingleton = null
    
    // Clear any OrbitDB data from localStorage/IndexedDB if possible
    if (typeof window !== "undefined" && window.indexedDB) {
      // Clear OrbitDB IndexedDB databases
      const databases = await window.indexedDB.databases?.()
      if (databases) {
        for (const db of databases) {
          if (db.name?.includes('orbitdb') || db.name?.includes('ipfs')) {
            try {
              const deleteReq = window.indexedDB.deleteDatabase(db.name)
              await new Promise((resolve, reject) => {
                deleteReq.onsuccess = () => resolve(true)
                deleteReq.onerror = () => reject(deleteReq.error)
              })
            } catch (e) {
              console.warn(`Failed to delete database ${db.name}:`, e)
            }
          }
        }
      }
    }
    
    console.log('OrbitDB state reset successfully')
  } catch (error) {
    console.warn('OrbitDB reset failed:', error)
  }
}
