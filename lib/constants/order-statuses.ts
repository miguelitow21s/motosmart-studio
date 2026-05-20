import type { OrderStatus } from "@/types"

export const ORDER_STATUSES: {
  value: OrderStatus
  label: string
  color: string
  bgColor: string
  order: number
}[] = [
  {
    value: "received",
    label: "Recibido",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    order: 1,
  },
  {
    value: "designing",
    label: "Diseñando",
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    order: 2,
  },
  {
    value: "production",
    label: "Producción",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    order: 3,
  },
  {
    value: "sewing",
    label: "Cosiendo",
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
    order: 4,
  },
  {
    value: "finished",
    label: "Terminado",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    order: 5,
  },
  {
    value: "delivered",
    label: "Entregado",
    color: "text-zinc-400",
    bgColor: "bg-zinc-400/10",
    order: 6,
  },
]

export const ORDER_STATUS_MAP = Object.fromEntries(
  ORDER_STATUSES.map((s) => [s.value, s])
) as Record<OrderStatus, (typeof ORDER_STATUSES)[0]>

export const WORK_TYPES = [
  { value: "cover", label: "Forro" },
  { value: "foam", label: "Modificación de espuma" },
  { value: "embroidery", label: "Bordado" },
  { value: "design", label: "Diseño de sillín" },
  { value: "full_custom", label: "Full Custom" },
  { value: "repair", label: "Reparación" },
] as const
