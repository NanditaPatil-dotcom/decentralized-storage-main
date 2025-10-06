"use client"

import { useEffect, useRef, useState } from "react"
import { getBrowserHelia } from "@/lib/helia-browser"

export function useHelia() {
  const mounted = useRef(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      return
    }

    // Wait for full document readiness
    const initHelia = async () => {
      try {
        mounted.current = true
        await getBrowserHelia()
        if (mounted.current) setReady(true)
      } catch (e: any) {
        console.error("Helia initialization error:", e)
        if (mounted.current) setError(e?.message || "Failed to start IPFS node")
      }
    }

    // Simple approach without addEventListener
    if (document.readyState === "complete") {
      initHelia()
    } else {
      // Use timer to check when ready
      const checkReady = () => {
        if (document.readyState === "complete") {
          initHelia()
        } else {
          setTimeout(checkReady, 100)
        }
      }
      setTimeout(checkReady, 100)
    }

    return () => {
      mounted.current = false
    }
  }, [])

  return { ready, error }
}
