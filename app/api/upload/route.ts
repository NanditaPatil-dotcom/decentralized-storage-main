import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("file")
    const userJwt = form.get("jwt")
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "Missing file" }, { status: 400 })
    }
    if (!userJwt || typeof userJwt !== "string") {
      return NextResponse.json({ message: "Missing JWT token" }, { status: 400 })
    }

    // Basic JWT format validation
    if (!userJwt.startsWith("eyJ")) {
      return NextResponse.json({ message: "Invalid JWT format" }, { status: 400 })
    }

    // Upload to Pinata using user's JWT
    const uploadForm = new FormData()
    uploadForm.append("file", file, (file as File).name)

    console.log('Uploading to Pinata with user JWT...')

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userJwt}`
      },
      body: uploadForm,
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Pinata upload error:', res.status, errorText)

      if (res.status === 401) {
        return NextResponse.json({
          message: "Pinata authentication failed. Please check your JWT token.",
          details: errorText
        }, { status: 401 })
      }

      return NextResponse.json({
        message: `Pinata upload failed (${res.status}): ${errorText}`
      }, { status: 502 })
    }

    const data = await res.json()
    console.log('Pinata response:', data)

    // Pinata returns the IPFS hash in the IpfsHash field
    const cid = data?.IpfsHash
    if (!cid) {
      return NextResponse.json({
        message: "CID not found in Pinata response",
        response: data
      }, { status: 502 })
    }

    return NextResponse.json({ cid })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({
      message: err?.message || "Unexpected error during upload",
      error: err.toString()
    }, { status: 500 })
  }
}
