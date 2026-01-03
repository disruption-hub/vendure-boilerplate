import { z } from 'zod'

interface JsonRequestOptions {
  init?: RequestInit
  includeErrorCode?: boolean
  fallbackErrorMessage?: string
}

function extractErrorMessage(payload: unknown, response: Response, fallback?: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const errorValue = (payload as { error?: unknown }).error
    if (typeof errorValue === 'string' && errorValue.trim()) {
      return errorValue
    }
  }

  if (fallback && fallback.trim()) {
    return fallback
  }

  if (response.statusText && response.statusText.trim()) {
    return response.statusText
  }

  return 'Request failed'
}

export async function requestJson<TSchema extends z.ZodTypeAny>(
  input: RequestInfo | URL,
  schema: TSchema,
  options: JsonRequestOptions = {},
): Promise<z.infer<TSchema>> {
  const { init, includeErrorCode = false, fallbackErrorMessage } = options
  const response = await fetch(input, init)

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  const message = extractErrorMessage(payload, response, fallbackErrorMessage)
  const errorCode = includeErrorCode && payload && typeof payload === 'object' && 'code' in payload && typeof (payload as any).code === 'string'
    ? (payload as any).code
    : undefined

  if (!response.ok) {
    const error = new Error(message)
    if (errorCode) {
      ;(error as any).code = errorCode
    }
    throw error
  }

  const result = schema.safeParse(payload)
  if (!result.success) {
    const error = new Error(message)
    if (errorCode) {
      ;(error as any).code = errorCode
    }
    throw error
  }

  return result.data
}
