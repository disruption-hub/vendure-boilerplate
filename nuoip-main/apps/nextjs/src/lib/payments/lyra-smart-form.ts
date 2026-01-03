import KRGlue from '@lyracom/embedded-form-glue'

export type LyraTheme = 'neon' | 'classic'

const themeAssetPromises = new Map<string, Promise<void>>()

function buildThemeAssets(scriptBaseUrl: string, theme: LyraTheme) {
  const sanitized = scriptBaseUrl.replace(/\/$/, '')
  const themeBase = `${sanitized}/ext`
  const mainBase = `${sanitized}/stable`

  if (theme === 'classic') {
    return {
      css: `${themeBase}/classic-reset.min.css`,
      themeJs: `${themeBase}/classic.js`,
      mainJs: `${mainBase}/kr-payment-form.min.js`,
    }
  }

  return {
    css: `${themeBase}/neon-reset.min.css`,
    themeJs: `${themeBase}/neon.js`,
    mainJs: `${mainBase}/kr-payment-form.min.js`,
  }
}

function ensureLinkElement(href: string) {
  const selector = `link[data-lyra-asset="${href}"]`
  let element = document.head.querySelector(selector) as HTMLLinkElement | null
  if (element) {
    return element
  }
  element = document.createElement('link')
  element.rel = 'stylesheet'
  element.href = href
  element.dataset.lyraAsset = href
  document.head.appendChild(element)
  return element
}

function ensureScriptElement(src: string, attributes?: Record<string, string>) {
  const selector = `script[data-lyra-asset="${src}"]`
  let element = document.head.querySelector(selector) as HTMLScriptElement | null
  if (element) {
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        if (value) {
          element!.setAttribute(key, value)
        } else {
          element!.removeAttribute(key)
        }
      })
    }
    return element
  }

  element = document.createElement('script')
  element.src = src
  element.async = false
  element.dataset.lyraAsset = src
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element!.setAttribute(key, value)
    })
  }
  document.head.appendChild(element)
  return element
}

export function deriveLyraEndpoint(scriptBaseUrl: string): string {
  try {
    const url = new URL(scriptBaseUrl)
    return url.origin
  } catch {
    return scriptBaseUrl.replace(/\/static\/js\/krypton-client.*$/, '') || scriptBaseUrl
  }
}

export async function ensureLyraThemeAssets(scriptBaseUrl: string, theme: LyraTheme): Promise<void> {
  const key = `${scriptBaseUrl}|${theme}`
  const existing = themeAssetPromises.get(key)
  if (existing) {
    await existing
    return
  }

  const promise = (async () => {
    const { css, themeJs } = buildThemeAssets(scriptBaseUrl, theme)

    ensureLinkElement(css)

    await new Promise<void>((resolve, reject) => {
      const script = ensureScriptElement(themeJs)
      if (script.dataset.lyraLoaded === 'true') {
        resolve()
        return
      }

      script.addEventListener('load', () => {
        script.dataset.lyraLoaded = 'true'
        resolve()
      })
      script.addEventListener('error', () => {
        reject(new Error(`Failed to load Lyra theme script ${themeJs}`))
      })
    })
  })()

  themeAssetPromises.set(key, promise)
  await promise
}

interface InitializeLyraFormOptions {
  container: HTMLElement
  formSelector?: string
  scriptBaseUrl: string
  publicKey: string
  formToken: string
  theme: LyraTheme
  language?: string
  successUrl?: string
  failureUrl?: string
}

interface LyraFormHandle {
  removeForms: () => Promise<void>
}

export async function initializeLyraSmartForm(options: InitializeLyraFormOptions): Promise<LyraFormHandle> {
  const { container, formSelector, scriptBaseUrl, publicKey, formToken, theme, language, successUrl, failureUrl } =
    options

  await ensureLyraThemeAssets(scriptBaseUrl, theme)
  const endpoint = deriveLyraEndpoint(scriptBaseUrl)
  const { KR } = await KRGlue.loadLibrary(endpoint, publicKey)

  await KR.removeForms()

  const config: Record<string, unknown> = {
    formToken,
    'kr-spa-mode': true,
  }

  if (language) {
    config['kr-language'] = language
  }

  if (successUrl) {
    config['kr-post-url-success'] = successUrl
    console.log('[initializeLyraSmartForm] Setting success URL:', successUrl)
  }

  if (failureUrl) {
    config['kr-post-url-refused'] = failureUrl
    console.log('[initializeLyraSmartForm] Setting failure URL:', failureUrl)
  }

  console.log('[initializeLyraSmartForm] Form config:', {
    hasFormToken: !!config.formToken,
    successUrl: config['kr-post-url-success'],
    failureUrl: config['kr-post-url-refused'],
    language: config['kr-language'],
  })

  await KR.setFormConfig(config)

  const renderTarget: string | HTMLElement | Array<HTMLElement> | undefined = formSelector
    ? formSelector
    : container.matches('.kr-smart-form')
      ? container
      : (container.querySelector('.kr-smart-form') as HTMLElement | null) ?? undefined

  if (!renderTarget) {
    throw new Error('Lyra smart form element not found in container')
  }

  await KR.renderElements(renderTarget)

  return {
    removeForms: async () => {
      try {
        await KR.removeForms()
      } catch (error) {
        if (error && typeof error === 'object' && 'KR' in (error as Record<string, unknown>)) {
          const fallback = (error as Record<string, unknown>).KR
          if (fallback && typeof (fallback as { removeForms?: () => Promise<unknown> }).removeForms === 'function') {
            await (fallback as { removeForms?: () => Promise<unknown> }).removeForms?.().catch(() => undefined)
          }
        }
      }
    },
  }
}
