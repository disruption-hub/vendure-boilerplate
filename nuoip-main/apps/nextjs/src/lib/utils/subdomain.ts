const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

function sanitize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function normalizeSubdomain(input: string): string {
  const sanitized = sanitize(input.trim())
  if (!sanitized) {
    throw new Error('Subdomain is required')
  }

  if (!SUBDOMAIN_PATTERN.test(sanitized)) {
    throw new Error('Subdomain must contain only lowercase letters, numbers, or hyphens')
  }

  return sanitized
}

export function buildTenantDomain(subdomain: string, rootDomain?: string): string {
  const root = (rootDomain ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'flowcast.chat').trim()
  return `${subdomain}.${root}`
}

export function sanitizeSubdomainInput(input: string): string {
  return sanitize(input)
}

export function extractSubdomainFromHost(host: string | null | undefined, rootDomain?: string): string | null {
  if (!host) {
    return null
  }

  const normalizedHost = host.split(':')[0]?.toLowerCase() ?? ''
  if (!normalizedHost) {
    return null
  }

  if (normalizedHost === 'localhost' || normalizedHost === '127.0.0.1') {
    return null
  }

  const root = (rootDomain ?? process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'flowcast.chat').trim().toLowerCase()
  if (!root) {
    return null
  }

  if (normalizedHost === root || normalizedHost === `www.${root}`) {
    return null
  }

  if (!normalizedHost.endsWith(`.${root}`)) {
    return null
  }

  const candidate = normalizedHost.slice(0, normalizedHost.length - (root.length + 1))
  if (!candidate) {
    return null
  }

  const firstSegment = candidate.split('.')[0]
  const cleaned = sanitize(firstSegment)
  if (!cleaned) {
    return null
  }

  return SUBDOMAIN_PATTERN.test(cleaned) ? cleaned : null
}
