type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMethod {
  (message: string, meta?: Record<string, unknown>): void
}

export interface Logger {
  debug: LogMethod
  info: LogMethod
  warn: LogMethod
  error: LogMethod
}

function emitLog(level: LogLevel, namespace: string, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString()
  const payload = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
  const formatted = `[${timestamp}] [${namespace}] ${message}${payload}`

  switch (level) {
    case 'debug':
      console.debug(formatted)
      break
    case 'info':
      console.info(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'error':
      console.error(formatted)
      break
  }
}

export function createLogger(namespace: string): Logger {
  const safeNamespace = namespace || 'app'
  return {
    debug: (message, meta) => emitLog('debug', safeNamespace, message, meta),
    info: (message, meta) => emitLog('info', safeNamespace, message, meta),
    warn: (message, meta) => emitLog('warn', safeNamespace, message, meta),
    error: (message, meta) => emitLog('error', safeNamespace, message, meta),
  }
}
