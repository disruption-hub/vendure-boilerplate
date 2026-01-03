type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const levelToConsole: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
}

function formatMeta(meta?: Record<string, unknown>): string {
  if (!meta) return ''

  try {
    return ` ${JSON.stringify(meta)}`
  } catch (error) {
    console.warn('[logger] Failed to stringify metadata', error)
    return ''
  }
}

export function log(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>): void {
  const consoleMethod = levelToConsole[level]
  const timestamp = new Date().toISOString()
  consoleMethod(`[${timestamp}] [${scope}] [${level.toUpperCase()}] ${message}${formatMeta(meta)}`)
}

export function createLogger(scope: string) {
  return {
    debug(message: string, meta?: Record<string, unknown>) {
      log('debug', scope, message, meta)
    },
    info(message: string, meta?: Record<string, unknown>) {
      log('info', scope, message, meta)
    },
    warn(message: string, meta?: Record<string, unknown>) {
      log('warn', scope, message, meta)
    },
    error(message: string, meta?: Record<string, unknown>) {
      log('error', scope, message, meta)
    },
  }
}
