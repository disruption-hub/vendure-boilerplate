export interface RenderTemplateOptions {
  variables?: Record<string, unknown>
}

const PLACEHOLDER_REGEX = /{{\s*([a-zA-Z0-9_.]+)\s*}}/g

function resolveVariable(path: string, variables: Record<string, unknown>): unknown {
  const segments = path.split('.').map(segment => segment.trim()).filter(Boolean)
  let current: any = variables

  for (const segment of segments) {
    if (current == null || typeof current !== 'object') {
      return undefined
    }
    current = current[segment]
  }

  return current
}

export function renderTemplate(content: string, options: RenderTemplateOptions = {}): string {
  if (!content) {
    return ''
  }

  const variables = options.variables ?? {}

  return content.replace(PLACEHOLDER_REGEX, (_, key: string) => {
    const value = resolveVariable(key, variables)
    if (value === null || value === undefined) {
      return ''
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  })
}
