export const runtime = "nodejs"

export async function GET() {
  return new Response(JSON.stringify({ items: [] }), { status: 200 })
}


export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { wallet, id, filename } = body || {}
    if (!wallet || !id || !filename) {
      return NextResponse.json({ message: "wallet, id, and filename are required" }, { status: 400 })
    }

    const store = await getUserDocStore(wallet)
    const existing = store.get(id)
    if (!existing) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 })
    }

    const updated = { ...existing, filename }
    await store.put(updated)
    return NextResponse.json({ ok: true, doc: updated })
  } catch (err: any) {
    console.error("Files PATCH error:", err)
    return NextResponse.json({ message: err?.message || "Failed to rename file" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = searchParams.get("wallet")
    const id = searchParams.get("id")
    if (!wallet || !id) {
      return NextResponse.json({ message: "wallet and id are required" }, { status: 400 })
    }

    const store = await getUserDocStore(wallet)
    const existing = store.get(id)
    if (!existing) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 })
    }
    await store.del(id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("Files DELETE error:", err)
    return NextResponse.json({ message: err?.message || "Failed to delete file" }, { status: 500 })
  }
}
