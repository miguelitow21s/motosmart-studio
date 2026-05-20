"use client"

import { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils/formatters"
import { getWeeklyChartData, type DayStats } from "../services/ordersService"

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 font-medium mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-zinc-200 font-medium">
            {p.name === "Ingresos" ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ProductionChart() {
  const [data, setData] = useState<DayStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWeeklyChartData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <Skeleton className="h-48 w-full bg-zinc-800/60 rounded-lg" />
  }

  const isEmpty = data.every((d) => d.creados === 0 && d.terminados === 0)

  if (isEmpty) {
    return (
      <div className="h-48 flex items-center justify-center text-zinc-700 text-sm border border-dashed border-zinc-800 rounded-lg">
        Sin datos esta semana — crea tu primer pedido
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={192}>
      <BarChart data={data} barSize={14} barGap={4}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#27272a"
        />
        <XAxis
          dataKey="day"
          tick={{ fill: "#71717a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#52525b", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={24}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#27272a" }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#71717a", paddingTop: 8 }}
          iconType="circle"
          iconSize={6}
        />
        <Bar
          dataKey="creados"
          name="Creados"
          fill="#6366f1"
          radius={[3, 3, 0, 0]}
        />
        <Bar
          dataKey="terminados"
          name="Terminados"
          fill="#10b981"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
