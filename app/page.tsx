"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/simple-toast"
import {
  DynamicPlasma as Plasma,
  DynamicGlowingFeatureCards as GlowingFeatureCards,
  DynamicCardNav as CardNav,
  DynamicSteps as Steps,
  DynamicWalletConnect as WalletConnect
} from "@/components/dynamic-client-components"

export default function HomePage() {
  const [address, setAddress] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleWalletConnected = (addr: string) => {
    setAddress(addr)
    localStorage.setItem('user-address', addr)
    toast({ title: "Wallet connected", description: addr })

    setIsAuthenticated(true)
    setTimeout(() => {
      router.push("/dashboard")
    }, 1500)
  }

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file)
      setUploadedImage(imageUrl)
      toast({ title: "Image uploaded", description: "Your image is now displayed below" })
    } else {
      toast({ title: "Please select an image file", variant: "destructive" })
    }
  }

  const navItems = []

  if (isAuthenticated) {
    return (
      <main className="w-full h-full bg-background text-foreground relative overflow-hidden">
        {/* Animated Background - Full Screen */}
        <div className="fixed inset-0 w-full h-full z-0">
          <Plasma color="#5931DD" speed={0.8} scale={1.2} opacity={0.9} />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 min-h-dvh flex items-center justify-center">
          <Card className="w-full max-w-lg backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <p className="text-white/80 text-lg">
                
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="w-full h-full bg-background text-foreground relative overflow-hidden">
      {/* Animated Background - Full Screen */}
      <div className="fixed inset-0 w-full h-full z-0">
        <Plasma color="#5931DD" speed={0.8} scale={1.2} opacity={0.9} />
      </div>

      {/* Card Navigation */}
      <CardNav
        items={navItems}
        baseColor="#f8f9fa"
        menuColor="#333"
        buttonBgColor="#000"
        buttonTextColor="#fff"
        ease="power3.out"
      />

      {/* Main Content */}
      <div className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-8 py-12 mt-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg mb-8" style={{ fontFamily: 'sans-serif', color: 'white' }}>
            Get your decentralized data<br />
            storage today!
          </h1>

          {/* Connect Wallet Button */}
          <div className="flex justify-center">
            {address ? (
              <div className="p-4 bg-white border rounded-lg">
                <p className="text-sm text-black text-center font-medium">
                  Wallet Connected
                </p>
              </div>
            ) : (
              <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg p-4">
                <WalletConnect
                  onConnected={handleWalletConnected}
                  onDisconnected={() => {
                    setAddress(null)
                  }}
                />
              </div>
            )}
          </div>
       </div>
     </div>

     {/* Next Section */}
     <div id="next-section" className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-8 py-12">
       <div className="w-full max-w-6xl mx-auto">
         <div className="text-center mb-12">
           <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-6">How It Works</h2>
           <p className="text-lg text-white/80">Follow these simple steps to get started with decentralized file storage</p>
         </div>
         <Steps />
       </div>
     </div>

     {/* Glowing Cards */}
     <div className="relative z-10 px-8 pt-6 pb-20 -mt-8 md:-mt-24">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">Secure & Private</h2>
        </div>
        <GlowingFeatureCards />
      </div>
    </main>
  )
}
