"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FileUpload } from "@/components/file-upload"
import { FileList } from "@/components/file-list"
import { useToast } from "@/hooks/use-toast"

export default function Page() {
  const router = useRouter()
  const [address, setAddress] = useState<string | null>(null)
  const { toast } = useToast()

  // Get address from localStorage on component mount
  useEffect(() => {
    const storedAddress = localStorage.getItem('user-address')
    if (storedAddress) {
      setAddress(storedAddress)
    } else {
      // Redirect to home if no address found
      router.push('/')
    }
  }, [router])

  // Show loading state while checking authentication
  if (address === null) {
    return (
      <main className="min-h-dvh bg-background text-foreground flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-semibold">Verifying Access...</h2>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="w-full border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-pretty">Decentralized File Storage</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.clear()
                window.location.href = '/'
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-pretty">Upload a File to IPFS</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload userAddress={address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-pretty">Your Files</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Files are uploaded to IPFS via Pinata. The resulting CID is saved on-chain under your address.
            </p>
            <Separator className="my-4" />
            <FileList userAddress={address} />
          </CardContent>
        </Card>
      </section>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-6 text-sm text-muted-foreground">
        </div>
      </footer>
    </main>
  )
}
