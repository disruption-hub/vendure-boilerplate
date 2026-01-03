import type { AdminStats } from '@/features/admin/api/admin-api'

interface OverviewTabProps {
  stats: AdminStats | null
}

export function OverviewTab({ stats }: OverviewTabProps) {
  // Show loading state if stats are not available
  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="overflow-hidden admin-card">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-200 animate-pulse">
                      <span className="text-sm font-medium text-gray-400">•</span>
                    </div>
                  </div>
                  <div className="ml-3 w-0 flex-1 sm:ml-5">
                    <dl>
                      <dt className="truncate text-sm font-medium text-slate-600">Loading...</dt>
                      <dd className="text-xl font-semibold text-black">-</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <div className="overflow-hidden admin-card">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--admin-color-primary)]">
                  <span className="text-sm font-medium text-[var(--admin-color-primary-foreground)]">U</span>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1 sm:ml-5">
                <dl>
                  <dt className="truncate text-sm font-medium text-slate-600">Total Users</dt>
                  <dd className="text-xl font-semibold text-black">{stats.totalUsers ?? 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden admin-card">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--admin-color-secondary)]">
                  <span className="text-sm font-medium text-[var(--admin-color-secondary-foreground)]">T</span>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1 sm:ml-5">
                <dl>
                  <dt className="truncate text-sm font-medium text-slate-600">Trademarks</dt>
                  <dd className="text-xl font-semibold text-black">{stats.totalTrademarks ?? 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden admin-card">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--admin-color-success)]">
                  <span className="text-sm font-medium text-[var(--admin-color-primary-foreground)]">S</span>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1 sm:ml-5">
                <dl>
                  <dt className="truncate text-sm font-medium text-slate-600">Active Sessions</dt>
                  <dd className="text-xl font-semibold text-black">{stats.activeSessions ?? 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden admin-card">
          <div className="p-4 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--admin-color-warning)]">
                  <span className="text-sm font-medium text-[var(--admin-color-primary-foreground)]">H</span>
                </div>
              </div>
              <div className="ml-3 w-0 flex-1 sm:ml-5">
                <dl>
                  <dt className="truncate text-sm font-medium text-slate-600">System Health</dt>
                  <dd className="text-xl font-semibold text-black capitalize">{stats.systemHealth ?? 'unknown'}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
