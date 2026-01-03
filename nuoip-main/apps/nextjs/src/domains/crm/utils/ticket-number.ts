export function formatTicketNumber(id: string, createdAt: Date | string): string {
  const normalizedId = (id ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const timestamp = createdAt instanceof Date ? createdAt : new Date(createdAt)
  const isValidDate = !Number.isNaN(timestamp.getTime())
  const reference = isValidDate ? timestamp : new Date()

  const isoLike = reference.toISOString().replace(/[-:TZ.]/g, '')
  const dateSegment = isoLike.slice(0, 12) // YYYYMMDDHHMM
  const suffix = normalizedId.slice(-4) || '0000'

  return `T${dateSegment}${suffix}`
}

export function formatTicketUpdateCode(ticketNumber: string, sequence: number): string {
  const base = (ticketNumber ?? '').trim()
  const safeSequence = Number.isFinite(sequence) ? Math.max(1, sequence) : 1
  return `${base}-${safeSequence.toString().padStart(2, '0')}`
}
