"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
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

  useEffect(() => {
    if (!window.ethereum) return
    window.ethereum.on?.("accountsChanged", (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0])
        onConnected?.(accounts[0])
      } else {
        setAddress(null)
        onDisconnected?.()
      }
    })
    window.ethereum.on?.("chainChanged", (chainId: string) => {
      setChainOk(chainId === AMOY_CHAIN_ID_HEX)
    })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function ensureAmoy() {
    if (!window.ethereum) return
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
    if (!window.ethereum) {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to continue.",
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
