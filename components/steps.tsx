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
    title: "Add the custom network(Amoy)",
    description: "Network Name: Amoy \nRPC URL: https://rpc-amoy.polygon.technology/\nChain ID: 80002\nCurrency: POL\nBlock Explorer: https://www.oklink.com/amoy"
  },
  {
    number: 3,
    title: "Polygon Faucet(for gas fees)",
    description: "For gas fees you can get free tokens from polygon faucet"
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
                  <p><strong>Network Name:</strong> Amoy</p>
                  <p><strong>RPC URL:</strong> https://rpc-amoy.polygon.technology/</p>
                  <p><strong>Chain ID:</strong> 80002</p>
                  <p><strong>Currency:</strong> POL</p>
                  <p><strong>Block Explorer:</strong> https://www.oklink.com/amoy</p>
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
                    onClick={() => window.open('https://faucet.polygon.technology/?utm_source=chatgpt.com', '_blank')}
                    className="bg-[#683FEE] hover:bg-[#5a35d1] text-white"
                  >
                    Polygon Faucet
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