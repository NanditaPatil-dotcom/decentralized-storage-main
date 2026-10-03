"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const steps = [
  {
    number: 1,
    title: "Create Your Wallet",
    description: "Create a wallet to store your files securely."
  },
  {
    number: 2,
    title: "Switch to Sepolia",
    description: "Network Name: Sepolia\nChain ID: 11155111\nCurrency: ETH\nBlock Explorer: https://sepolia.etherscan.io"
  },
  {
    number: 3,
    title: "Get Sepolia ETH",
    description: "Get free Sepolia ETH from a testnet faucet for gas fees."
  },
  {
    number: 4,
    title: "Connect to your wallet",
    description: "After pumping, you can get back to the website and connect to your wallet"
  }
]

export function Steps() {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <Card key={step.number} className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              {index === 0 ? null : index === 1 ? null : index === 2 ? null : index === 3 ? null : (
                <div className="w-12 h-12 bg-gradient-to-br from-[#9b5cff] to-[#00bfff] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">{step.number}</span>
                </div>
              )}
              <h3 className={`text-lg font-semibold text-white mb-2 ${index === 0 || index === 3 ? 'text-center mt-4' : ''}`}>{step.title}</h3>
              {index === 1 ? (
                <div className="text-white/80 text-sm text-left">
                  <p><strong>Network Name:</strong> Sepolia</p>
                  <p><strong>Chain ID:</strong> 11155111</p>
                  <p><strong>Currency:</strong> ETH</p>
                  <p><strong>Block Explorer:</strong> https://sepolia.etherscan.io</p>
                </div>
              ) : (
                <p className={`text-white/80 text-sm ${index === 0 ? 'text-center' : ''} ${index === 3 ? 'text-center' : ''}`}>{step.description}</p>
              )}
              {index === 0 && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => window.open('https://metamask.io/download/', '_blank')}
                    className="bg-[#683FEE] hover:bg-[#5a35d1] text-white"
                  >
                    Download MetaMask
                  </Button>
                </div>
              )}
              {index === 2 && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => window.open('https://faucets.chain.link/sepolia', '_blank')}
                    className="bg-[#683FEE] hover:bg-[#5a35d1] text-white"
                  >
                    Sepolia Faucet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
