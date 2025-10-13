"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  DynamicFileUpload as FileUpload
} from "@/components/dynamic-client-components"
import { ServerFileList } from "@/components/server-file-list"
import { useToast } from "@/components/ui/simple-toast"

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
      // No address, redirect to home
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
    <main className="min-h-dvh bg-gray-950 text-white">
      <header className="w-full border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">Vaultix</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
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

      <section className="container mx-auto px-4 py-8 grid gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Upload a File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload userAddress={address} />
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Your Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              Files uploaded via the server route are stored on Filebase (S3/IPFS) and stored using Solidity.
            </p>
            <Separator className="my-4 bg-gray-700" />
            <ServerFileList userAddress={address} />
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
