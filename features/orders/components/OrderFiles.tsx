"use client"

import { useEffect, useRef, useState } from "react"
import { Paperclip, Upload, X, FileImage, FileText, Loader2, Download } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/authStore"
import { formatRelativeTime } from "@/lib/utils/formatters"
import type { Database } from "@/types/database.types"

type FileRow = Database["public"]["Tables"]["files"]["Row"]
type FileType = "logo" | "reference" | "final_photo" | "other"

const FILE_TYPES: { value: FileType; label: string }[] = [
  { value: "reference", label: "Referencia" },
  { value: "logo", label: "Logo / Bordado" },
  { value: "final_photo", label: "Foto final" },
  { value: "other", label: "Otro" },
]

const ACCEPT = "image/*,.pdf,.svg"
const MAX_MB = 10

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase()
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) {
    return <FileImage className="size-4 text-indigo-400" />
  }
  return <FileText className="size-4 text-zinc-400" />
}

interface Props {
  orderId: string
}

export function OrderFiles({ orderId }: Props) {
  const user = useAuthStore((s) => s.user)
  const [files, setFiles] = useState<FileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState<FileType>("reference")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function loadFiles() {
    const supabase = createClient()
    const { data } = await supabase
      .from("files")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
    setFiles(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadFiles() }, [orderId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`El archivo supera el límite de ${MAX_MB}MB`)
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop()
      const path = `orders/${orderId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("files")
        .upload(path, file, { upsert: false })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from("files").getPublicUrl(path)

      const { error: dbError } = await supabase.from("files").insert({
        order_id: orderId,
        name: file.name,
        url: publicUrl,
        type: selectedType,
        size: file.size,
        created_by: user.id,
      })
      if (dbError) throw dbError

      toast.success("Archivo subido")
      await loadFiles()
    } catch {
      toast.error("Error al subir el archivo")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function handleDelete(file: FileRow) {
    setDeletingId(file.id)
    try {
      const supabase = createClient()
      // Extract storage path from URL
      const urlParts = file.url.split("/storage/v1/object/public/files/")
      if (urlParts[1]) {
        await supabase.storage.from("files").remove([urlParts[1]])
      }
      await supabase.from("files").delete().eq("id", file.id)
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
      toast.success("Archivo eliminado")
    } catch {
      toast.error("Error al eliminar")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Paperclip className="size-4 text-zinc-500" />
        <h3 className="text-sm font-medium text-zinc-300">Archivos adjuntos</h3>
        {!loading && (
          <span className="text-xs text-zinc-600">({files.length})</span>
        )}
      </div>

      {/* Upload zone */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as FileType)}
          className="h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs px-2 focus:outline-none focus:border-indigo-500"
        >
          {FILE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs hover:border-indigo-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
        >
          {uploading
            ? <Loader2 className="size-3 animate-spin" />
            : <Upload className="size-3" />}
          {uploading ? "Subiendo..." : "Subir archivo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleUpload}
        />
        <span className="text-xs text-zinc-600">máx. {MAX_MB}MB</span>
      </div>

      {/* File list */}
      {loading ? (
        <div className="h-16 flex items-center justify-center">
          <Loader2 className="size-4 animate-spin text-zinc-600" />
        </div>
      ) : files.length === 0 ? (
        <p className="text-xs text-zinc-600 py-4 text-center">Sin archivos adjuntos</p>
      ) : (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/60 transition-colors group"
            >
              <FileIcon name={f.name} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate">{f.name}</p>
                <p className="text-[10px] text-zinc-600">
                  {FILE_TYPES.find((t) => t.value === f.type)?.label} · {humanSize(f.size)} · {formatRelativeTime(f.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
                  title="Descargar"
                >
                  <Download className="size-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(f)}
                  disabled={deletingId === f.id}
                  className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  {deletingId === f.id
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : <X className="size-3.5" />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
