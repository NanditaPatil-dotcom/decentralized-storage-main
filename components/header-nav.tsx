"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { WalletConnect } from "@/components/wallet-connect"

type HeaderNavProps = {
  address: string | null
  onConnected: (addr: string) => void
  onDisconnected: () => void
}

export function HeaderNav({ address, onConnected, onDisconnected }: HeaderNavProps) {
  const navItems = [
    { label: "Projects", href: "#projects" },
    { label: "Bookmarks", href: "#bookmarks" },
    { label: "About", href: "#about" },
  ]

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#9b5cff] to-[#00bfff]" />
              <span className="text-sm font-semibold tracking-wide text-white/90">Vaultify</span>
            </div>

            {/* Nav Items */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className="relative text-sm text-white/80 hover:text-white transition-colors">
                  <span>{item.label}</span>
                  <motion.span
                    layoutId="underline"
                    className="absolute left-0 -bottom-1 h-px w-0 bg-gradient-to-r from-[#9b5cff] to-[#00bfff]"
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  />
                </a>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {address ? (
                <div className="hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white/90">
                  <span className="text-xs tracking-wide">{address.slice(0, 6)}...{address.slice(-4)}</span>
                  <Button variant="outline" size="sm" onClick={onDisconnected} className="border-white/20 text-white/90">
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="backdrop-blur-sm bg-white/10 border border-white/10 rounded-lg px-2 py-1">
                  <WalletConnect onConnected={onConnected} onDisconnected={onDisconnected} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}


