"use client"

// Dynamic imports to avoid SSR issues
let createHelia: any = null
let createUnixfs: any = null
type Helia = any
type UnixFS = any

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
      if (document.readyState === "complete") {
        resolve()
      } else {
        // Use timer instead of addEventListener
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

    // Load Helia dynamically only when needed
    if (!createHelia) {
      const heliaModule = await import("helia")
      createHelia = heliaModule.createHelia
    }
    if (!createUnixfs) {
      const unixfsModule = await import("@helia/unixfs")
      createUnixfs = unixfsModule.unixfs
    }

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
  // Validate input
  if (!input) {
    throw new Error("No input provided to addFile")
  }
  
  const inst = await getBrowserHelia().catch((e) => {
    throw new Error(`Helia init failed: ${e?.message || e}`)
  })
  const { unixfs } = inst || ({} as any)
  if (!unixfs || typeof (unixfs as any).addBytes !== "function") {
    throw new Error("Helia unixfs not available")
  }

  let bytes: Uint8Array
  try {
    if (input instanceof Blob) {
      bytes = new Uint8Array(await input.arrayBuffer())
    } else if (input instanceof ArrayBuffer) {
      bytes = new Uint8Array(input)
    } else if (input instanceof Uint8Array) {
      bytes = input
    } else {
      throw new Error("Unsupported input type")
    }
    
    // Validate bytes array
    if (!bytes || bytes.length === 0) {
      throw new Error("Empty or invalid file data")
    }
  } catch (e: any) {
    throw new Error(`Failed to convert input to bytes: ${e?.message || e}`)
  }

  try {
    // Additional safety check before calling addBytes
    if (!(bytes instanceof Uint8Array)) {
      throw new Error("Bytes is not a Uint8Array: " + bytes?.constructor?.name)
    }
    
    const cid = await unixfs.addBytes(bytes)
    if (!cid) {
      throw new Error("Failed to generate CID")
    }
    return cid.toString()
  } catch (e: any) {
    // Check if it's the IPLD undefined error
    if (e?.message?.includes?.('undefined') && e?.message?.includes?.('IPLD')) {
      throw new Error("File contains invalid data that cannot be stored in IPFS")
    }
    throw new Error(`Failed to add file to IPFS: ${e?.message || e}`)
  }
}

export async function addFileViaHttp(input: Blob | ArrayBuffer | Uint8Array) {
  if (typeof window === "undefined") {
    throw new Error("addFileViaHttp must run in the browser")
  }

  const bytes =
    input instanceof Blob
      ? await input.arrayBuffer()
      : input instanceof ArrayBuffer
      ? input
      : input

  // Use a public IPFS HTTP gateway for fallback upload
  const gatewayUrl = "https://gateway.pinata.cloud/ipfs/"

  try {
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      body: bytes,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP upload failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    return result.IpfsHash || result.Hash || result.cid?.toString() || result.hash
  } catch (error: any) {
    throw new Error(`Failed to upload via HTTP: ${error?.message || error}`)
  }
}
