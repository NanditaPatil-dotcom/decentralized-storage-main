"use client"

// Note: dynamic import of @orbitdb/core in getOrbitDB to avoid SSR/native load
import type { OrbitDB, Documents } from "@orbitdb/core"
import { getBrowserHelia } from "@/lib/helia-browser"

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

let orbitSingleton: Promise<{ orbitdb: OrbitDB }> | null = null
let filesStoreSingleton: Promise<Documents<FileDoc>> | null = null

export async function getOrbitDB() {
  if (orbitSingleton) return orbitSingleton
  orbitSingleton = (async () => {
    const { helia } = await getBrowserHelia()
    const { createOrbitDB } = await import("@orbitdb/core")
    // createOrbitDB wires identity internally; no separate @orbitdb/identity package needed
    const orbitdb = await createOrbitDB({ ipfs: helia })
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
      const store = await orbitdb.open<FileDoc>(dbName(), {
        type: "documents",
        indexBy: "_id",
      })
      // Ensure store is ready
      await store.load()
      return store
    } catch (e) {
      // If opening/loading fails (e.g., corrupted local state), try recreating under a namespaced name
      const fallbackName = `${dbName()}-fallback`
      const store = await orbitdb.open<FileDoc>(fallbackName, {
        type: "documents",
        indexBy: "_id",
      })
      await store.load().catch(() => {})
      return store
    }
  })()
  return filesStoreSingleton
}

export async function putFileDoc(doc: FileDoc) {
  const store = await getFilesStore()
  // If doc exists, this will update it since _id is the index key
  await store.put(doc)
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


