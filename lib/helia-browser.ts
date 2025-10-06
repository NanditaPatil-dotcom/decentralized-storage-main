"use client"

import { createHelia, type Helia } from "helia"
import { unixfs as createUnixfs, type UnixFS } from "@helia/unixfs"

let heliaSingleton: Promise<{ helia: Helia; unixfs: UnixFS }> | null = null
let activeHelia: Helia | null = null // prevent re-init in React strict mode

export async function getBrowserHelia() {
  if (heliaSingleton) return heliaSingleton

  heliaSingleton = (async () => {
    if (typeof window === "undefined") {
      throw new Error("Helia browser node must run in the browser")
    }

    // ✅ Wait until the DOM is fully ready before initializing Helia
    await new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve()
      else window.addEventListener("load", () => resolve(), { once: true })
    })

    // ✅ Prevent double initialization
    if (activeHelia) {
      return { helia: activeHelia, unixfs: createUnixfs(activeHelia) }
    }

    // ✅ Create Helia with minimal config (browser-safe, no external connections)
    const helia = await createHelia({
      start: false, // Don't auto-start networking
    })
    activeHelia = helia

    // ✅ Attach UnixFS for file operations
    const unixfs = createUnixfs(helia)
    return { helia, unixfs }
  })()

  return heliaSingleton
}

export async function stopBrowserHelia() {
  const inst = await heliaSingleton?.catch(() => null)
  if (inst) {
    await inst.helia.stop().catch(() => {})
  }
  activeHelia = null
  heliaSingleton = null
}

export async function addFile(input: Blob | ArrayBuffer | Uint8Array) {
  const inst = await getBrowserHelia().catch((e) => {
    throw new Error(`Helia init failed: ${e?.message || e}`)
  })
  const { unixfs } = inst || ({} as any)
  if (!unixfs || typeof (unixfs as any).addBytes !== "function") {
    throw new Error("Helia unixfs not available")
  }

  const bytes =
    input instanceof Blob
      ? new Uint8Array(await input.arrayBuffer())
      : input instanceof ArrayBuffer
      ? new Uint8Array(input)
      : input

  const cid = await unixfs.addBytes(bytes)
  return cid.toString()
}

export async function addFiles(
  files: Array<{ name: string; data: Blob | ArrayBuffer | Uint8Array }>
) {
  const inst = await getBrowserHelia().catch((e) => {
    throw new Error(`Helia init failed: ${e?.message || e}`)
  })
  const { unixfs } = inst || ({} as any)
  if (!unixfs || typeof (unixfs as any).addBytes !== "function") {
    throw new Error("Helia unixfs not available")
  }

  const results: Array<{ name: string; cid: string }> = []
  for (const f of files) {
    const bytes =
      f.data instanceof Blob
        ? new Uint8Array(await (f.data as Blob).arrayBuffer())
        : f.data instanceof ArrayBuffer
        ? new Uint8Array(f.data as ArrayBuffer)
        : (f.data as Uint8Array)
    const cid = await unixfs.addBytes(bytes)
    results.push({ name: f.name, cid: cid.toString() })
  }

  return results
}
