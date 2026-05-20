import { cn } from "@/lib/utils"
import { ORDER_STATUS_MAP } from "@/lib/constants/order-statuses"
import type { OrderStatus } from "@/types"

interface StatusBadgeProps {
  status: OrderStatus
  size?: "sm" | "md"
  className?: string
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const config = ORDER_STATUS_MAP[status]
  if (!config) return null

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.bgColor,
        config.color,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {config.label}
    </span>
  )
}
