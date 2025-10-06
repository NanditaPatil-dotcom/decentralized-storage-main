"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BrowserProvider } from "ethers"
import { CID } from "multiformats/cid"
import { sha256 } from "multiformats/hashes/sha2"

interface ServerFileItem {
  fileName: string
  CID: string
  timestamp: string
}

type Props = { userAddress: string | null }

const FILEBASE_GATEWAY = (process.env.NEXT_PUBLIC_FILEBASE_GATEWAY || "https://ipfs.filebase.io/ipfs").replace(/\/$/, "")

export function ServerFileList({ userAddress }: Props) {
  const [items, setItems] = useState<ServerFileItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [verifying, setVerifying] = useState<Record<string, boolean>>({})
  const [verified, setVerified] = useState<Record<string, "ok" | "fail" | "unsupported" | "error">>({})

  useEffect(() => {
    // Listen for server upload completion to refresh list
    function onUploadComplete(e: Event) {
      // Just refetch to be consistent with backend state
      void refresh()
    }
    window.addEventListener("server-upload-complete", onUploadComplete as EventListener)
    return () => window.removeEventListener("server-upload-complete", onUploadComplete as EventListener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!userAddress) {
      setItems([])
      return
    }
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress])

  async function refresh() {
    if (!userAddress) return
    try {
      setLoading(true)
      setError(null)
      const message = `I authorize listing for ${userAddress}`
      const signedMessage = await signMessage(message)
      const params = new URLSearchParams({
        wallet: userAddress,
        signedMessage,
        message,
      })
      const res = await fetch(`/api/files?${params.toString()}`, { method: "GET", cache: "no-store" })
      if (!res.ok) {
        const err = await safeJson(res)
        throw new Error(err?.message || `Failed to fetch files: ${res.status}`)
      }
      const data = (await res.json()) as ServerFileItem[]
      setItems(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error("ServerFileList error:", e)
      setError(e?.message || "Unable to fetch files")
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  async function signMessage(message: string): Promise<string> {
    if (typeof window === "undefined" || !window.ethereum) throw new Error("MetaMask not available")
    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return signer.signMessage(message)
  }

  async function verifyCid(cidStr: string): Promise<"ok" | "fail" | "unsupported" | "error"> {
    try {
      setVerifying((m) => ({ ...m, [cidStr]: true }))
      setVerified((m) => ({ ...m, [cidStr]: undefined as any }))

      const cid = CID.parse(cidStr)
      // Only support raw codec simple verification path (code 0x55 = 85)
      if (cid.code !== 0x55) {
        setVerified((m) => ({ ...m, [cidStr]: "unsupported" }))
        return "unsupported"
      }

      const url = `${FILEBASE_GATEWAY}/${cidStr}`
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) {
        setVerified((m) => ({ ...m, [cidStr]: "error" }))
        return "error"
      }
      const buf = new Uint8Array(await res.arrayBuffer())
      const mh = await sha256.digest(buf)
      const ok = bytesEqual(mh.bytes, cid.multihash.bytes)
      setVerified((m) => ({ ...m, [cidStr]: ok ? "ok" : "fail" }))
      return ok ? "ok" : "fail"
    } catch (e) {
      console.warn("Verification error", e)
      setVerified((m) => ({ ...m, [cidStr]: "error" }))
      return "error"
    } finally {
      setVerifying((m) => ({ ...m, [cidStr]: false }))
    }
  }

  const formatted = useMemo(() => {
    return (items || []).map((it) => ({
      ...it,
      dateText: it.timestamp ? new Date(it.timestamp).toLocaleString() : "",
      gatewayUrl: `${FILEBASE_GATEWAY}/${it.CID}`,
    }))
  }, [items])

  if (!userAddress) {
    return <p className="text-sm text-muted-foreground">Connect your wallet to see your server files.</p>
  }

  if (loading && !items) {
    return (
      <div className="grid gap-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">{error}</p>
        <Button size="sm" variant="ghost" onClick={refresh}>Try Again</Button>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">No server files yet.</p>
        <Button size="sm" variant="ghost" onClick={refresh}>Refresh</Button>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {formatted.map((it) => {
        const status = verified[it.CID]
        return (
          <div key={it.CID + it.timestamp} className="flex items-center justify-between rounded-md border p-3">
            <div className="text-sm">
              <div className="font-medium">{it.fileName || it.CID}</div>
              <div className="text-xs text-muted-foreground break-all">{it.CID}</div>
              <div className="text-xs text-muted-foreground">{it.dateText}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="secondary">
                <a href={it.gatewayUrl} target="_blank" rel="noreferrer">Download</a>
              </Button>
              <Button size="sm" variant="ghost" disabled={!!verifying[it.CID]} onClick={() => verifyCid(it.CID)}>
                {verifying[it.CID] ? "Verifying…" : status === "ok" ? "Verified" : status === "fail" ? "Hash mismatch" : status === "unsupported" ? "Verify N/A" : "Verify"}
              </Button>
              <Button size="sm" variant="ghost" onClick={refresh}>Refresh</Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function bytesEqual(a: Uint8Array, b: Uint8Array) {
  if (a === b) return true
  if (a.byteLength !== b.byteLength) return false
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

async function safeJson(res: Response) {
  try { return await res.json() } catch { return null }
}