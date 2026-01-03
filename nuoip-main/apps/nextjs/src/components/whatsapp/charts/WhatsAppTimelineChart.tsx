'use client'

import type { FC } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type TimelinePoint = {
  iso: string
  sent: number
  received: number
  total: number
}

type Props = {
  data: TimelinePoint[]
  formatTick: (value: string) => string
  formatTooltip: (value: string) => string
  formatValue: (value: number) => string
}

const WhatsAppTimelineChart: FC<Props> = ({ data, formatTick, formatTooltip, formatValue }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis dataKey="iso" tickFormatter={formatTick} stroke="#64748B" fontSize={12} />
        <YAxis stroke="#64748B" fontSize={12} tickFormatter={value => formatValue(value as number)} />
        <Tooltip formatter={(value: number) => formatValue(value)} labelFormatter={formatTooltip} />
        <Legend />
        <Area type="monotone" dataKey="sent" name="Enviados" stroke="#22C55E" strokeWidth={2} fill="url(#colorSent)" />
        <Area type="monotone" dataKey="received" name="Recibidos" stroke="#3B82F6" strokeWidth={2} fill="url(#colorReceived)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default WhatsAppTimelineChart
