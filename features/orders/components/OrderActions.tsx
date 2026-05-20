"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Download, QrCode, Printer, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/lib/utils/formatters"
import { ORDER_STATUSES, WORK_TYPES } from "@/lib/constants/order-statuses"
import { ROUTES } from "@/lib/constants/routes"
import type { OrderStatus } from "@/types"
import type { Database } from "@/types/database.types"

type OrderRow = Database["public"]["Tables"]["orders"]["Row"] & {
  client: Database["public"]["Tables"]["clients"]["Row"] | null
  motorcycle: Database["public"]["Tables"]["motorcycles"]["Row"] | null
}

interface Props {
  order: OrderRow
}

export function OrderActions({ order }: Props) {
  const [qrOpen, setQrOpen] = useState(false)

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}${ROUTES.publicOrder(order.serial)}`
    : ""

  const workLabel = WORK_TYPES.find((t) => t.value === order.work_type)?.label ?? order.work_type
  const statusConfig = ORDER_STATUSES.find((s) => s.value === (order.status as OrderStatus))

  async function handlePrintPdf() {
    const { default: JsPDF } = await import("jspdf")

    const doc = new JsPDF({ unit: "mm", format: "a4" })
    const W = doc.internal.pageSize.getWidth()
    const margin = 20

    // ── Header ──────────────────────────────────────────────
    doc.setFillColor(15, 15, 17)
    doc.rect(0, 0, W, 40, "F")

    doc.setTextColor(99, 102, 241) // indigo
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("MotoSmart Studio", margin, 18)

    doc.setTextColor(161, 161, 170) // zinc-400
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("Tapicería especializada en sillines de motos", margin, 26)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(`Orden de Trabajo #${order.serial}`, W - margin, 20, { align: "right" })

    doc.setTextColor(161, 161, 170)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(formatDate(order.created_at), W - margin, 28, { align: "right" })

    // ── Status badge ────────────────────────────────────────
    doc.setFillColor(99, 102, 241)
    doc.roundedRect(W - margin - 30, 32, 30, 8, 2, 2, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text(statusConfig?.label ?? order.status, W - margin - 15, 37.5, { align: "center" })

    let y = 55

    // ── Section helper ───────────────────────────────────────
    const section = (title: string) => {
      doc.setFillColor(24, 24, 27)
      doc.rect(margin, y, W - margin * 2, 7, "F")
      doc.setTextColor(161, 161, 170)
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.text(title.toUpperCase(), margin + 3, y + 5)
      y += 12
    }

    const row = (label: string, value: string, highlight = false) => {
      doc.setTextColor(113, 113, 122)
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text(label, margin + 3, y)
      doc.setTextColor(highlight ? 251 : 228, highlight ? 146 : 228, highlight ? 60 : 230)
      doc.setFont("helvetica", "bold")
      doc.text(value, margin + 55, y)
      y += 7
    }

    // ── Cliente ─────────────────────────────────────────────
    section("Datos del cliente")
    row("Nombre", order.client?.name ?? "—")
    row("Teléfono", order.client?.phone ?? "—")
    if (order.client?.email) row("Email", order.client.email)
    y += 3

    // ── Pedido ───────────────────────────────────────────────
    section("Detalle del trabajo")
    const motoStr = order.motorcycle
      ? `${order.motorcycle.brand} ${order.motorcycle.model}${order.motorcycle.displacement ? ` ${order.motorcycle.displacement}` : ""}`
      : order.motorcycle_custom ?? "—"
    row("Motocicleta", motoStr)
    row("Tipo de trabajo", workLabel)
    if (order.delivery_date) row("Fecha de entrega", formatDate(order.delivery_date))
    y += 3

    if (order.notes) {
      section("Notas / Especificaciones")
      doc.setTextColor(161, 161, 170)
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      const lines = doc.splitTextToSize(order.notes, W - margin * 2 - 6) as string[]
      doc.text(lines, margin + 3, y)
      y += lines.length * 5 + 5
    }

    // ── Precios ──────────────────────────────────────────────
    section("Resumen de pagos")
    row("Precio total", formatCurrency(order.total_price))
    row("Abono recibido", formatCurrency(order.deposit))
    row("Saldo pendiente", formatCurrency(order.balance), order.balance > 0)
    y += 5

    // ── Firma ────────────────────────────────────────────────
    const pageH = doc.internal.pageSize.getHeight()
    doc.setDrawColor(63, 63, 70)
    doc.line(margin, pageH - 35, margin + 60, pageH - 35)
    doc.line(W - margin - 60, pageH - 35, W - margin, pageH - 35)
    doc.setTextColor(113, 113, 122)
    doc.setFontSize(8)
    doc.text("Firma del cliente", margin, pageH - 30)
    doc.text("Recibido conforme", W - margin - 60, pageH - 30)

    doc.setFontSize(7)
    doc.setTextColor(63, 63, 70)
    doc.text(
      `Generado el ${new Date().toLocaleDateString("es-CO")} · MotoSmart Studio`,
      W / 2, pageH - 10, { align: "center" }
    )

    doc.save(`orden-${order.serial}.pdf`)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setQrOpen(true)}
          className="h-8 text-xs border-zinc-800 text-zinc-400 hover:text-zinc-200 gap-1.5"
        >
          <QrCode className="w-3.5 h-3.5" />
          QR
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handlePrintPdf}
          className="h-8 text-xs border-zinc-800 text-zinc-400 hover:text-zinc-200 gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" />
          PDF
        </Button>
      </div>

      {/* QR Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="bg-[#111113] border-zinc-800 text-zinc-200 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              Código QR — Pedido #{order.serial}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG
                value={publicUrl}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-zinc-600 text-center break-all max-w-xs">
              {publicUrl}
            </p>
            <p className="text-xs text-zinc-500 text-center">
              Comparte este código con el cliente para que pueda seguir el estado de su pedido en tiempo real
            </p>
            <div className="flex gap-2 w-full">
              <Button
                size="sm"
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white gap-1.5"
                onClick={() => {
                  const svg = document.querySelector(".qr-export svg") as SVGElement | null
                  if (!svg) return
                  const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `qr-${order.serial}.svg`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <Download className="w-3.5 h-3.5" />
                Descargar SVG
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQrOpen(false)}
                className="border-zinc-800 text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="qr-export hidden">
              <QRCodeSVG value={publicUrl} size={400} level="M" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
