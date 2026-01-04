import { createHash } from 'crypto'

export type LyraEnvironment = 'test' | 'production'

export interface LyraFormTokenContext {
  mode: LyraEnvironment
  fingerprint: string
  generatedAt: string
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function computeLyraFormTokenFingerprint(input: {
  mode: LyraEnvironment
  apiBaseUrl?: string | null
  scriptBaseUrl?: string | null
  publicKey: string
  apiUser?: string | null
}): string {
  const payload = {
    v: 1,
    mode: input.mode,
    apiBaseUrl: (input.apiBaseUrl ?? '').trim(),
    scriptBaseUrl: (input.scriptBaseUrl ?? '').trim(),
    publicKey: input.publicKey.trim(),
    apiUser: (input.apiUser ?? '').trim(),
  }
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

export function extractLyraFormTokenContext(metadata: unknown): LyraFormTokenContext | null {
  if (!isPlainObject(metadata)) {
    return null
  }

  const ctx = metadata.lyraFormTokenContext
  if (!isPlainObject(ctx)) {
    return null
  }

  const mode = ctx.mode
  const fingerprint = ctx.fingerprint
  const generatedAt = ctx.generatedAt

  if (mode !== 'test' && mode !== 'production') {
    return null
  }

  if (typeof fingerprint !== 'string' || !fingerprint.trim()) {
    return null
  }

  if (typeof generatedAt !== 'string' || !generatedAt.trim()) {
    return null
  }

  return {
    mode,
    fingerprint: fingerprint.trim(),
    generatedAt: generatedAt.trim(),
  }
}

export function withUpdatedLyraFormTokenContext(metadata: unknown, next: LyraFormTokenContext): Record<string, unknown> {
  const base = isPlainObject(metadata) ? metadata : {}
  return {
    ...base,
    lyraFormTokenContext: next,
  }
}

export function isReusableLyraFormToken(input: {
  formToken?: string | null
  formTokenExpiresAt?: Date | null
  now?: Date
  expectedContext: { mode: LyraEnvironment; fingerprint: string }
  metadata: unknown
}): boolean {
  const now = input.now ?? new Date()

  if (!input.formToken || typeof input.formToken !== 'string') {
    return false
  }

  if (!input.formTokenExpiresAt || !(input.formTokenExpiresAt instanceof Date)) {
    return false
  }

  if (input.formTokenExpiresAt.getTime() <= now.getTime()) {
    return false
  }

  const stored = extractLyraFormTokenContext(input.metadata)
  if (!stored) {
    return false
  }

  return stored.mode === input.expectedContext.mode && stored.fingerprint === input.expectedContext.fingerprint
}
