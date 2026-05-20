import { format, formatDistanceToNow, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), "dd MMM yyyy", { locale: es })
}

export function formatDatetime(dateString: string): string {
  return format(parseISO(dateString), "dd MMM yyyy, HH:mm", { locale: es })
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), {
    addSuffix: true,
    locale: es,
  })
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return phone
}
