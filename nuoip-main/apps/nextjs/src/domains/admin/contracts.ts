export interface UpdateSettingsCommand {
  tenantId: string
  patch: Record<string, unknown>
  paths: string[]
  actorId: string
}

export interface AdminSettingsSnapshot {
  tenantId: string
  values: Record<string, unknown>
  updatedAt: Date
}

export interface AdminFacade {
  updateSettings(command: UpdateSettingsCommand): Promise<AdminSettingsSnapshot>
}
