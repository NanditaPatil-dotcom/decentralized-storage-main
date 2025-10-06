"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/simple-toast"
import { cn } from "@/lib/utils"

type Props = {
  onConnected?: (address: string) => void
  onDisconnected?: () => void
  className?: string
}

const AMOY_CHAIN_ID_HEX = "0x13882" // 80002
const AMOY_PARAMS = {
  chainId: AMOY_CHAIN_ID_HEX,
  chainName: "Polygon Amoy",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: ["https://rpc-amoy.polygon.technology/"],
  blockExplorerUrls: ["https://www.oklink.com/amoy"],
}

declare global {
  interface Window {
    ethereum?: any
  }
}

export function WalletConnect({ onConnected, onDisconnected, className }: Props) {
  const [address, setAddress] = useState<string | null>(null)
  const [chainOk, setChainOk] = useState<boolean>(false)
  const { toast } = useToast()
  
  function openMetaMaskOnboardingWindow() {
    // Only run in browser environment
    if (typeof window === "undefined") return
    
    // Open MetaMask download/onboarding in a compact popup
    const url = "https://metamask.io/download.html"
    window.open(
      url,
      "metamaskOnboarding",
      "width=420,height=720,menubar=no,toolbar=no,location=no,status=no"
    )
  }

  useEffect(() => {
    // Only run in browser environment after DOM is ready
    if (typeof window === "undefined" || typeof document === "undefined") return
    
    // Store event handler references for cleanup
    let accountsHandler: ((accounts: string[]) => void) | null = null
    let chainHandler: ((chainId: string) => void) | null = null
    
    // Wait for DOM ready state
    const initWallet = () => {
      if (!window.ethereum) return
      
      // Add better safety checks for MetaMask provider
      try {
        // Ensure the provider is ready and has event listener capability
        if (window.ethereum && typeof window.ethereum.on === 'function') {
          accountsHandler = (accounts: string[]) => {
            if (accounts && accounts.length > 0) {
              setAddress(accounts[0])
              onConnected?.(accounts[0])
            } else {
              setAddress(null)
              onDisconnected?.()
            }
          }
          
          chainHandler = (chainId: string) => {
            setChainOk(chainId === AMOY_CHAIN_ID_HEX)
          }
          
          window.ethereum.on("accountsChanged", accountsHandler)
          window.ethereum.on("chainChanged", chainHandler)
        }
      } catch (error) {
        console.warn('MetaMask event listeners could not be added:', error)
      }
      ;(async () => {
        try {
          const accounts: string[] = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts && accounts.length) {
            setAddress(accounts[0])
            onConnected?.(accounts[0])
          }
          const chainId: string = await window.ethereum.request({ method: "eth_chainId" })
          setChainOk(chainId === AMOY_CHAIN_ID_HEX)
        } catch {
          // ignore
        }
      })()
    }
    
    if (document.readyState === "complete") {
      initWallet()
    } else {
      const checkReady = () => {
        if (document.readyState === "complete") {
          initWallet()
        } else {
          setTimeout(checkReady, 100)
        }
      }
      setTimeout(checkReady, 100)
    }
    
    // Cleanup function to remove event listeners
    return () => {
      if (window.ethereum && typeof window.ethereum.removeListener === 'function') {
        try {
          if (accountsHandler) {
            window.ethereum.removeListener("accountsChanged", accountsHandler)
          }
          if (chainHandler) {
            window.ethereum.removeListener("chainChanged", chainHandler)
          }
        } catch (error) {
          console.warn('Could not remove MetaMask event listeners:', error)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function ensureAmoy() {
    if (typeof window === "undefined" || !window.ethereum) return
    try {
      const chainId: string = await window.ethereum.request({ method: "eth_chainId" })
      if (chainId === AMOY_CHAIN_ID_HEX) {
        setChainOk(true)
        return
      }
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: AMOY_CHAIN_ID_HEX }],
        })
      } catch (switchError: any) {
        if (switchError?.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [AMOY_PARAMS],
          })
        } else {
          throw switchError
        }
      }
      setChainOk(true)
    } catch (err: any) {
      setChainOk(false)
      toast({
        title: "Network error",
        description: "Please add/switch to Polygon Amoy in MetaMask.",
        variant: "destructive",
      })
    }
  }

  async function connect() {
    if (typeof window === "undefined" || !window.ethereum) {
      openMetaMaskOnboardingWindow()
      toast({
        title: "MetaMask required",
        description: "A MetaMask window was opened to install or create a wallet.",
        variant: "destructive",
      })
      return
    }
    await ensureAmoy()
    try {
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      if (accounts && accounts.length) {
        setAddress(accounts[0])
        onConnected?.(accounts[0])
        toast({ title: "Connected", description: accounts[0] })
      }
    } catch (err: any) {
      toast({ title: "Connection rejected", variant: "destructive" })
    }
  }

  function disconnect() {
    setAddress(null)
    onDisconnected?.()
    toast({ title: "Disconnected" })
  }

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!address ? (
        <Button onClick={connect}>Connect Wallet</Button>
      ) : (
        <>
          <span className={cn("text-sm", chainOk ? "text-foreground" : "text-destructive")}>
            {short} {chainOk ? "(Amoy)" : "(Wrong network)"}
          </span>
          <Button variant="secondary" onClick={ensureAmoy}>
            Switch Network
          </Button>
          <Button variant="ghost" onClick={disconnect}>
            Disconnect
          </Button>
        </>
      )}
    </div>
  )
}
