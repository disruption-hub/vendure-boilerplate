'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  getPaymentReports,
  type PaymentReportSummary,
  type AdminPaymentLinkStatus,
  type AdminPaymentLinkChannel,
  type PaymentLinkRecord,
} from '@/features/admin/api/admin-api'

const statusLabels: Record<AdminPaymentLinkStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

const channelLabels: Record<AdminPaymentLinkChannel, string> = {
  chatbot: 'Chatbot',
  admin: 'Admin Panel',
  api: 'API',
  unknown: 'Unknown',
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100)
}

function currencySummaryDisplay(summary: PaymentReportSummary | null, field: 'total' | 'average' | 'completed'): string {
  if (!summary) {
    return '—'
  }

  if (!summary.totals.currencyTotals.length) {
    return '—'
  }

  return summary.totals.currencyTotals
    .map(item => {
      const value =
        field === 'total'
          ? item.totalAmountCents
          : field === 'average'
            ? item.averageTicketCents
            : item.completedAmountCents
      return `${formatCurrency(value, item.currency)} (${item.currency})`
    })
    .join('\n')
}

function formatDateTime(input: string): string {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) {
    return input
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getCustomerDisplay(link: PaymentLinkRecord): string {
  if (link.customerName && link.customerEmail) {
    return `${link.customerName} (${link.customerEmail})`
  }
  return link.customerName ?? link.customerEmail ?? '—'
}

export function PaymentReportsTab({ tenantId }: { tenantId?: string }) {
  const [data, setData] = useState<PaymentReportSummary | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const summary = await getPaymentReports({ limit: 10, tenantId })
      setData(summary)
    } catch (err) {
      console.error('Failed to load payment reports', err)
      setError(err instanceof Error ? err.message : 'Unable to load payment reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReports()
  }, [])

  const statusRows = useMemo(() => data?.statusBreakdown ?? [], [data])
  const channelRows = useMemo(() => data?.channelBreakdown ?? [], [data])
  const recentLinks = useMemo(() => data?.recentLinks ?? [], [data])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-black">Payment Link Reports</h2>
        <button
          type="button"
          onClick={() => void loadReports()}
          className="inline-flex items-center rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-black shadow-sm transition-colors hover:bg-gray-50 hover:text-black active:bg-gray-100 active:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
          style={{ backgroundColor: 'white', color: 'black', borderColor: '#d1d5db' }}
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 flex items-center justify-center py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-black" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="text-sm text-black">Total Links</div>
              <div className="mt-2 text-2xl font-semibold text-black">
                {formatNumber(data.totals.totalLinks)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="text-sm text-black">Completed Links</div>
              <div className="mt-2 text-2xl font-semibold text-black">
                {formatNumber(data.totals.completedLinks)}
              </div>
              <div className="mt-1 text-xs text-black">
                Completion rate: {formatPercent(data.totals.completionRate)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="text-sm text-black">Total Volume</div>
              <div className="mt-2 whitespace-pre-line text-base font-semibold text-black">
                {currencySummaryDisplay(data, 'total')}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="text-sm text-black">Average Ticket</div>
              <div className="mt-2 whitespace-pre-line text-base font-semibold text-black">
                {currencySummaryDisplay(data, 'average')}
              </div>
              <div className="mt-1 text-xs text-black">
                Completed volume: {currencySummaryDisplay(data, 'completed')}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-medium text-black">Status Breakdown</h3>
              <table className="mt-4 min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-black">Status</th>
                    <th className="px-4 py-2 text-right font-medium text-black">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {statusRows.map(row => (
                    <tr key={row.status}>
                      <td className="px-4 py-2 text-black">{statusLabels[row.status]}</td>
                      <td className="px-4 py-2 text-right text-black">{formatNumber(row.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-medium text-black">Channel Breakdown</h3>
              <table className="mt-4 min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-black">Channel</th>
                    <th className="px-4 py-2 text-right font-medium text-black">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {channelRows.map(row => (
                    <tr key={row.channel}>
                      <td className="px-4 py-2 text-black">{channelLabels[row.channel]}</td>
                      <td className="px-4 py-2 text-right text-black">{formatNumber(row.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-medium text-black">Recent Payment Links</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-black">Created</th>
                    <th className="px-4 py-2 text-left font-medium text-black">Product</th>
                    <th className="px-4 py-2 text-left font-medium text-black">Customer</th>
                    <th className="px-4 py-2 text-right font-medium text-black">Amount</th>
                    <th className="px-4 py-2 text-left font-medium text-black">Status</th>
                    <th className="px-4 py-2 text-left font-medium text-black">Channel</th>
                    <th className="px-4 py-2 text-left font-medium text-black">Token</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentLinks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-black">
                        No payment links found for the selected period.
                      </td>
                    </tr>
                  )}
                  {recentLinks.map(link => (
                    <tr key={link.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-black">{formatDateTime(link.createdAt)}</td>
                      <td className="px-4 py-2 text-black">
                        {link.product?.name || link.product?.productCode || '—'}
                      </td>
                      <td className="px-4 py-2 text-black">{getCustomerDisplay(link)}</td>
                      <td className="px-4 py-2 text-right text-black">
                        {formatCurrency(link.amountCents, link.currency)}
                      </td>
                      <td className="px-4 py-2 text-black">{statusLabels[link.status]}</td>
                      <td className="px-4 py-2 text-black">{channelLabels[link.channel]}</td>
                      <td className="px-4 py-2 text-black">{link.token}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
