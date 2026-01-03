import type { MemoryDetails } from '@/features/admin/api/admin-api'

interface MemoryTabProps {
  details: MemoryDetails | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function MemoryTab({ details, loading, error, onRetry }: MemoryTabProps) {
  const overviewItems = [
    { key: 'totalSessions', label: 'Memory Sessions', accent: 'bg-[var(--admin-color-accent)]' },
    { key: 'totalMessages', label: 'Buffer Messages', accent: 'bg-[var(--admin-color-secondary)]' },
    { key: 'totalEntities', label: 'Memory Entities', accent: 'bg-[var(--admin-color-primary)]' },
    { key: 'totalSummaries', label: 'Conversation Summaries', accent: 'bg-[var(--admin-color-warning)]' },
    { key: 'totalKnowledgeNodes', label: 'Knowledge Nodes', accent: 'bg-[var(--admin-color-info)]' },
    { key: 'totalKnowledgeRelationships', label: 'Knowledge Relationships', accent: 'bg-[var(--admin-color-danger)]' },
  ] as const

  const systemHealth = details?.systemHealth
  const memoryStats = (systemHealth?.memoryStats ?? {}) as Record<string, unknown>

  return (
    <div className="space-y-6">
      {loading && (
        <div className="rounded-md border border-slate-300 bg-slate-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-600">Loading Memory Details...</h3>
              <p className="mt-1 text-sm text-slate-600">Fetching memory system data...</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-slate-300 bg-slate-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-600">Error Loading Memory Details</h3>
              <p className="mt-1 text-sm text-slate-600">{error}</p>
              <button
                onClick={onRetry}
                className="mt-2 text-sm text-red-600 underline hover:text-orange-600"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {details && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-black">Memory Types Overview</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-5">
              {overviewItems.map(item => {
                const value = Number(details.overview?.[item.key] ?? 0)
                return (
                  <div key={item.key} className="overflow-hidden admin-card">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-md ${item.accent}`}>
                            <span className="text-sm font-medium text-[var(--admin-color-accent-foreground)]">
                              {value > 999 ? '∞' : value}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 w-0 flex-1 sm:ml-5">
                          <dl>
                            <dt className="truncate text-sm font-medium text-slate-600">{item.label}</dt>
                            <dd className="text-xl font-semibold text-black">{value.toLocaleString()}</dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="admin-card p-4 sm:p-6 lg:col-span-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-black">Memory System</h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    systemHealth?.databaseConnected
                      ? 'bg-[var(--admin-color-success-soft)] text-[var(--admin-color-success)]'
                      : 'bg-[var(--admin-color-danger-soft)] text-[var(--admin-color-danger)]'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current"></span>
                  {systemHealth?.databaseConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Last Updated</span>
                  <span className="font-medium text-black">
                    {systemHealth?.lastUpdated ? new Date(systemHealth.lastUpdated).toLocaleString() : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Unique Sessions</span>
                  <span className="font-medium text-black">
                    {Number(memoryStats.unique_sessions ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Messages</span>
                  <span className="font-medium text-black">
                    {Number(memoryStats.total_messages ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Oldest Message</span>
                  <span className="font-medium text-black">
                    {memoryStats.oldest_message ? new Date(String(memoryStats.oldest_message)).toLocaleString() : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Newest Message</span>
                  <span className="font-medium text-black">
                    {memoryStats.newest_message ? new Date(String(memoryStats.newest_message)).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="admin-card p-4 sm:p-6 lg:col-span-2">
              <h3 className="text-base font-semibold text-black">Recent Memory Activity</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-black">Latest Sessions</h4>
                  <div className="mt-2 space-y-2">
                    {(details.recentActivity?.sessions ?? []).slice(0, 5).map((session: any, index: number) => (
                      <div key={index} className="rounded-md border border-slate-300 bg-slate-50 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-black">{String(session.sessionId ?? '—')}</span>
                          <span className="text-xs text-slate-600">
                            {'createdAt' in session && session.createdAt
                              ? new Date(String(session.createdAt)).toLocaleString()
                              : '—'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Messages: {Number((session as { message_count?: number }).message_count ?? 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {(details.recentActivity?.sessions?.length ?? 0) === 0 && (
                      <p className="text-sm text-slate-600">No recent sessions found.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-black">Latest Messages</h4>
                  <div className="mt-2 space-y-2">
                    {(details.recentActivity?.messages ?? []).slice(0, 5).map((message: any, index: number) => (
                      <div key={index} className="rounded-md border border-slate-300 bg-slate-50 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-black">{String(message.role ?? 'role')}</span>
                          <span className="text-xs text-slate-600">
                            {message.timestamp ? new Date(String(message.timestamp)).toLocaleString() : '—'}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">{String(message.content ?? '')}</p>
                      </div>
                    ))}
                    {(details.recentActivity?.messages?.length ?? 0) === 0 && (
                      <p className="text-sm text-slate-600">No recent messages found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
