'use client'

import type { FC } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type HourlyPoint = {
  hour: number
  sent: number
  received: number
  total: number
}

type Props = {
  data: HourlyPoint[]
  formatTick: (value: number) => string
  formatLabel: (value: number) => string
  formatValue: (value: number) => string
}

const WhatsAppHourlyChart: FC<Props> = ({ data, formatTick, formatLabel, formatValue }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis dataKey="hour" tickFormatter={formatTick} stroke="#64748B" fontSize={12} />
        <YAxis stroke="#64748B" fontSize={12} tickFormatter={value => formatValue(value as number)} />
        <Tooltip
          formatter={(value: number) => formatValue(value)}
          labelFormatter={(value: number) => formatLabel(value)}
        />
        <Legend />
        <Bar dataKey="sent" name="Enviados" stackId="a" fill="#22C55E" radius={[4, 4, 0, 0]} />
        <Bar dataKey="received" name="Recibidos" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default WhatsAppHourlyChart
