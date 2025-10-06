"use client"

import { useEffect, useRef, useState } from "react"
import { getBrowserHelia } from "@/lib/helia-browser"

export function useHelia() {
  const mounted = useRef(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined" || !window) {
      return
    }

    mounted.current = true
    ;(async () => {
      try {
        await getBrowserHelia()
        if (mounted.current) setReady(true)
      } catch (e: any) {
        if (mounted.current) setError(e?.message || "Failed to start IPFS node")
      }
    })()
    return () => {
      mounted.current = false
    }
  }, [])

  return { ready, error }
}
