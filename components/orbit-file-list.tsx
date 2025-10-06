"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getFilesStore, listFilesByWallet, deleteFileDoc } from "@/lib/orbitdb-browser"

type Props = { userAddress: string | null }

type FileItem = {
  _id: string
  wallet: string
  cid: string
  filename: string
  size: number
  mime: string
  createdAt: number
  folder?: string
  tags?: string[]
  encrypted?: boolean
  encAlgo?: string
}

const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs"

export function OrbitFileList({ userAddress }: Props) {
  const [items, setItems] = useState<FileItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [q, setQ] = useState("")
  const [folderFilter, setFolderFilter] = useState("")
  const [tagsFilter, setTagsFilter] = useState("")

  const formatted = useMemo(() => {
    if (!items) return [] as Array<FileItem & { sizeText: string, dateText: string }>
    const filtered = items.filter((f) => {
      const matchesQ = q
        ? (f.filename?.toLowerCase().includes(q.toLowerCase()) || f.cid?.includes(q))
        : true
      const matchesFolder = folderFilter ? (f.folder || "") === folderFilter : true
      const matchesTags = tagsFilter
        ? (f.tags || []).some(t => t.toLowerCase().includes(tagsFilter.toLowerCase()))
        : true
      return matchesQ && matchesFolder && matchesTags
    })
    return filtered.map((f) => ({
      ...f,
      sizeText: humanFileSize(f.size || 0),
      dateText: f.createdAt ? new Date(f.createdAt).toLocaleString() : "",
    }))
  }, [items, q, folderFilter, tagsFilter])

  const allFolders = useMemo(() => {
    const set = new Set<string>()
    for (const it of items || []) {
      if (it.folder) set.add(it.folder)
    }
    return Array.from(set).sort()
  }, [items])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        if (!userAddress) {
          setItems([])
          return
        }
        await getFilesStore()
        const docs = await listFilesByWallet(userAddress)
        if (active) setItems(docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
      } catch (e: any) {
        if (active) setError(e?.message || "Unable to load files")
      }
    })()
    // start polling for realtime-like updates
    if (timerRef.current) clearInterval(timerRef.current)
    if (userAddress) {
      timerRef.current = setInterval(() => {
        refresh().catch(() => {})
      }, 5000)
    }
    return () => {
      active = false
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [userAddress])

  async function refresh() {
    if (!userAddress) return
    const docs = await listFilesByWallet(userAddress)
    setItems(docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
  }

  async function handleRename(item: FileItem) {
    const newName = prompt("Enter new filename", item.filename)
    if (!newName || newName.trim() === item.filename) return
    const store = await getFilesStore()
    await store.put({ ...item, filename: newName.trim() })
    await refresh()
  }

  async function handleDelete(item: FileItem) {
    if (!confirm(`Delete ${item.filename}?`)) return
    await deleteFileDoc(item._id)
    await refresh()
  }

  if (!userAddress) {
    return <p className="text-sm text-muted-foreground">Connect your wallet to see your files.</p>
  }

  if (items === null && !error) {
    return (
      <div className="grid gap-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (!items || items.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">No files yet. Upload your first file!</p>
        <div>
          <Button size="sm" variant="ghost" onClick={refresh}>Refresh</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">Search</label>
          <input className="border rounded px-2 py-1 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or CID" />
        </div>
        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">Folder</label>
          <select className="border rounded px-2 py-1 text-sm" value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)}>
            <option value="">All</option>
            {allFolders.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs text-muted-foreground">Tags</label>
          <input className="border rounded px-2 py-1 text-sm" value={tagsFilter} onChange={(e) => setTagsFilter(e.target.value)} placeholder="tag" />
        </div>
        <div className="ml-auto">
          <Button size="sm" variant="ghost" onClick={refresh}>Refresh</Button>
        </div>
      </div>

      <div className="w-full overflow-x-auto border rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-muted/40">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">CID</th>
              <th className="p-3 font-medium">Folder</th>
              <th className="p-3 font-medium">Tags</th>
              <th className="p-3 font-medium">Size</th>
              <th className="p-3 font-medium">Added</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {formatted.map((f) => (
              <tr key={f._id} className="border-t">
                <td className="p-3 max-w-[260px] truncate">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{f.filename}</span>
                    {f.encrypted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 border">enc</span>
                    )}
                  </div>
                </td>
                <td className="p-3 max-w-[340px] truncate text-xs text-muted-foreground">{f.cid}</td>
                <td className="p-3 whitespace-nowrap">{f.folder || "—"}</td>
                <td className="p-3 whitespace-nowrap text-xs">{(f.tags || []).join(", ")}</td>
                <td className="p-3 whitespace-nowrap">{f.sizeText}</td>
                <td className="p-3 whitespace-nowrap">{f.dateText}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <a href={`${IPFS_GATEWAY}/${f.cid}`} target="_blank" rel="noreferrer">View</a>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleRename(f)}>Rename</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(f)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <Button size="sm" variant="ghost" onClick={refresh}>Refresh</Button>
      </div>
    </div>
  )
}

function humanFileSize(bytes: number) {
  const thresh = 1024
  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`
  }
  const units = ["KB", "MB", "GB", "TB"]
  let u = -1
  do {
    bytes /= thresh
    ++u
  } while (Math.abs(bytes) >= thresh && u < units.length - 1)
  return `${bytes.toFixed(1)} ${units[u]}`
}


