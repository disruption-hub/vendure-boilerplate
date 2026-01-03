'use client'

import type { FC } from 'react'
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts'

type StatusPoint = {
  status: string
  count: number
  percentage: number
}

type Props = {
  data: StatusPoint[]
  statusColors: Record<string, string>
  formatValue: (value: number) => string
}

const fallbackPalette = ['#6366F1', '#22C55E', '#3B82F6', '#F97316', '#F43F5E']

const WhatsAppStatusChart: FC<Props> = ({ data, statusColors, formatValue }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip formatter={(value: number, name: string) => [`${formatValue(value)} mensajes`, name]} />
        <Legend />
        <Pie data={data} dataKey="count" nameKey="status" innerRadius={60} outerRadius={90} paddingAngle={4}>
          {data.map((entry, index) => (
            <Cell
              key={entry.status}
              fill={statusColors[entry.status] ?? fallbackPalette[index % fallbackPalette.length]}
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}

export default WhatsAppStatusChart
