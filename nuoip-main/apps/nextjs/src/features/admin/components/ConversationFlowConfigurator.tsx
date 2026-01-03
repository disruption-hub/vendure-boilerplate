"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { Check, Copy, RefreshCw, GitBranch } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ConversationStep, IntentType } from '@/lib/chatbot/types'
import {
  buildStateMachineEdges,
  humanizeIdentifier,
  labelForIntent,
  type FlowCategory,
} from '@/lib/chatbot/state-machine/metadata'
import type { FlowConfig, FlowOverlayConfig } from '@/lib/chatbot/flow-config/types'
import { getChatbotFlowConfig } from '@/features/admin/api/admin-api'

type TransitionIntent = IntentType | 'ANY'

interface FlowNode {
  id: string
  title: string
  description: string
  category: FlowCategory
  shape?: 'rounded' | 'stadium' | 'circle' | 'diamond'
}

interface FlowEdge {
  from: string
  to: string
  label: string
  category: FlowCategory
  dashed?: boolean
  intent?: TransitionIntent
}

interface DiagramOptions {
  direction: 'LR' | 'TB'
  showProfile: boolean
  showAppointment: boolean
  showPayment: boolean
  showKnowledge: boolean
  showFallbacks: boolean
}

interface LegendEntry {
  category: FlowCategory
  active: boolean
  count: number
}

type MermaidRenderResult = {
  svg: string
  bindFunctions?: (element: Element) => void
}

interface MermaidInstance {
  initialize(config: Record<string, unknown>): void
  render(id: string, definition: string): Promise<MermaidRenderResult>
  parse?(definition: string): void
}

let mermaidLoader: Promise<MermaidInstance> | null = null

async function loadMermaid(): Promise<MermaidInstance> {
  if (typeof window === 'undefined') {
    throw new Error('Mermaid can only be loaded in the browser environment')
  }

  const existing = (window as unknown as { mermaid?: MermaidInstance }).mermaid
  if (existing) {
    return existing
  }

  if (!mermaidLoader) {
    mermaidLoader = new Promise<MermaidInstance>((resolve, reject) => {
      const SCRIPT_ID = 'vendor-mermaid-script'

      const attachHandlers = (target: HTMLScriptElement) => {
        const cleanup = () => {
          target.onload = null
          target.onerror = null
        }

        target.onload = () => {
          cleanup()
          const candidate = (window as unknown as { mermaid?: MermaidInstance }).mermaid
          if (!candidate) {
            mermaidLoader = null
            reject(new Error('Mermaid failed to initialize after loading the bundled script'))
            return
          }
          target.dataset.ready = '1'
          resolve(candidate)
        }

        target.onerror = () => {
          cleanup()
          mermaidLoader = null
          reject(new Error('Failed to load Mermaid bundle'))
        }
      }

      const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
      if (existingScript) {
        if (existingScript.dataset.ready === '1') {
          const candidate = (window as unknown as { mermaid?: MermaidInstance }).mermaid
          if (!candidate) {
            mermaidLoader = null
            reject(new Error('Mermaid failed to initialize after loading the bundled script'))
            return
          }
          resolve(candidate)
          return
        }
        attachHandlers(existingScript)
        return
      }

      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = '/vendor/mermaid.min.js'
      script.async = true
      attachHandlers(script)

      document.head.appendChild(script)
    })
  }

  return mermaidLoader
}

const categoryThemes: Record<FlowCategory, { label: string; accent: string; border: string }> = {
  core: { label: 'Core Journey', accent: '#60a5fa', border: '#1f2937' },
  profile: { label: 'Profile Capture', accent: '#38bdf8', border: '#0c4a6e' },
  appointment: { label: 'Scheduling', accent: '#34d399', border: '#064e3b' },
  payment: { label: 'Payments', accent: '#818cf8', border: '#312e81' },
  knowledge: { label: 'Knowledge Responses', accent: '#fbbf24', border: '#78350f' },
}

function escapeMermaid(text: string): string {
  return text.replace(/"/g, '\\"')
}

function buildNodeDefinition(node: FlowNode): string {
  const label = `${escapeMermaid(node.title)}\\n${escapeMermaid(node.description)}`
  if (node.shape === 'stadium') {
    return `${node.id}(["${label}"])`
  }
  if (node.shape === 'circle') {
    return `${node.id}(("${label}"))`
  }
  if (node.shape === 'diamond') {
    return `${node.id}{"${label}"}`
  }
  return `${node.id}["${label}"]`
}

function computeDiagramData(
  options: DiagramOptions,
  baseNodes: FlowNode[],
  baseEdges: FlowEdge[],
  overlayNodes: FlowNode[],
  overlayEdges: FlowEdge[],
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = []

  baseNodes.forEach(node => {
    if (node.category === 'profile' && !options.showProfile) return
    if (node.category === 'appointment' && !options.showAppointment) return
    nodes.push(node)
  })

  overlayNodes.forEach(node => {
    nodes.push(node)
  })

  const activeIds = new Set(nodes.map(node => node.id))
  const edges: FlowEdge[] = []

  baseEdges.forEach(edge => {
    if (!activeIds.has(edge.from) || !activeIds.has(edge.to)) {
      return
    }
    if (!options.showFallbacks && (edge.intent === 'ANY' || edge.from === edge.to)) {
      return
    }
    if (!options.showProfile && edge.category === 'profile') {
      return
    }
    if (!options.showAppointment && edge.category === 'appointment') {
      return
    }
    edges.push(edge)
  })

  overlayEdges.forEach(edge => {
    if (activeIds.has(edge.from) && activeIds.has(edge.to)) {
      edges.push(edge)
    }
  })

  return { nodes, edges }
}

function generateMermaidDefinition(nodes: FlowNode[], edges: FlowEdge[], direction: DiagramOptions['direction']): string {
  const lines: string[] = []

  lines.push(`flowchart ${direction}`)
  lines.push('  classDef core fill:#0f172a,stroke:#60a5fa,color:#dbeafe,stroke-width:2px;')
  lines.push('  classDef profile fill:#0b3a61,stroke:#38bdf8,color:#e0f2fe;')
  lines.push('  classDef appointment fill:#0f5132,stroke:#34d399,color:#d1fae5;')
  lines.push('  classDef payment fill:#1e1b4b,stroke:#818cf8,color:#ede9fe;')
  lines.push('  classDef knowledge fill:#713f12,stroke:#fbbf24,color:#fef3c7;')

  nodes.forEach(node => {
    lines.push(`  ${buildNodeDefinition(node)}`)
    lines.push(`  class ${node.id} ${node.category}`)
  })

  edges.forEach((edge, index) => {
    const labelSegment = edge.label ? `|${escapeMermaid(edge.label)}|` : ''
    lines.push(`  ${edge.from} -->${labelSegment} ${edge.to}`)
    const theme = categoryThemes[edge.category]
    const styleSegments = [`stroke:${theme.accent}`, 'stroke-width:2.2px']
    if (edge.dashed) {
      styleSegments.push('stroke-dasharray:6 4')
    }
    lines.push(`  linkStyle ${index} ${styleSegments.join(',')}`)
  })

  return lines.join('\n')
}

function buildLegendEntries(nodes: FlowNode[]): LegendEntry[] {
  return (Object.keys(categoryThemes) as FlowCategory[]).map(category => {
    const count = nodes.filter(node => node.category === category).length
    return {
      category,
      active: count > 0,
      count,
    }
  })
}

function buildConversationNodes(config: FlowConfig): FlowNode[] {
  return Object.entries(config.states).map(([step, definition]) => {
    const conversationStep = step as ConversationStep
    const category = config.categories?.[conversationStep] ?? 'core'
    const shape = config.shapes?.[conversationStep]
    return {
      id: conversationStep,
      title: humanizeIdentifier(conversationStep),
      description: definition.description,
      category,
      shape,
    }
  })
}

function buildBaseEdges(config: FlowConfig): FlowEdge[] {
  return buildStateMachineEdges().map(edge => ({
    from: edge.from,
    to: edge.to,
    label: config.intentLabels?.[edge.intent] ?? labelForIntent(edge.intent),
    category: config.categories?.[edge.to] ?? edge.category,
    dashed: edge.dashed,
    intent: edge.intent,
  }))
}

function mapOverlayNodes(overlay: FlowOverlayConfig): FlowNode[] {
  return overlay.nodes.map(node => ({
    id: node.id,
    title: node.title,
    description: node.description,
    category: node.category,
    shape: node.shape,
  }))
}

function mapOverlayEdges(overlay: FlowOverlayConfig): FlowEdge[] {
  return overlay.edges.map(edge => ({
    from: edge.from,
    to: edge.to,
    label: edge.label,
    category: edge.category,
    dashed: edge.dashed,
  }))
}

export function ConversationFlowConfigurator(): JSX.Element {
  const [flowConfig, setFlowConfig] = useState<FlowConfig | null>(null)
  
  // Early return if config not loaded yet
  if (!flowConfig) {
    return (
      <div className="rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-card-background)] p-6 text-sm text-[color:var(--admin-card-muted-text)]">
        Loading flow configuration...
      </div>
    )
  }
  const [configLoading, setConfigLoading] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR')
  const [showProfile, setShowProfile] = useState(true)
  const [showAppointment, setShowAppointment] = useState(true)
  const [showPayment, setShowPayment] = useState(true)
  const [showKnowledge, setShowKnowledge] = useState(true)
  const [showFallbacks, setShowFallbacks] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const [renderError, setRenderError] = useState<string | null>(null)
  const [svgMarkup, setSvgMarkup] = useState<string>('')
  const [isDarkMode, setIsDarkMode] = useState(false)

  const diagramId = useMemo(() => `conversation-mermaid-${Math.random().toString(36).slice(2, 10)}`, [])

  const isMountedRef = useRef(true)

  // Detect dark mode
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkDarkMode = () => {
      const root = document.documentElement
      const isDark = root.classList.contains('dark') || 
                     root.getAttribute('data-admin-theme-name')?.includes('dark') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(isDark)
    }

    checkDarkMode()

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-admin-theme-name'],
    })

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkDarkMode)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkDarkMode)
    }
  }, [])

  const fetchConfig = useCallback(async () => {
    try {
      setConfigLoading(true)
      setConfigError(null)
      const remoteConfig = await getChatbotFlowConfig()
      if (isMountedRef.current && remoteConfig) {
        setFlowConfig(remoteConfig)
      }
    } catch (error) {
      console.error('Failed to fetch chatbot flow configuration', error)
      if (isMountedRef.current) {
        setConfigError(error instanceof Error ? error.message : 'Unable to load flow configuration')
      }
    } finally {
      if (isMountedRef.current) {
        setConfigLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    void fetchConfig()
    return () => {
      isMountedRef.current = false
    }
  }, [fetchConfig])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handler = (event: Event) => {
      const custom = event as CustomEvent<FlowConfig | undefined>
      if (!isMountedRef.current) {
        return
      }
      if (custom.detail) {
        setFlowConfig(custom.detail)
        setConfigError(null)
        setConfigLoading(false)
      } else {
        void fetchConfig()
      }
    }

    window.addEventListener('chatbot-flow-config:updated', handler)
    return () => {
      window.removeEventListener('chatbot-flow-config:updated', handler)
    }
  }, [fetchConfig])

  const options = useMemo<DiagramOptions>(
    () => ({ direction, showProfile, showAppointment, showPayment, showKnowledge, showFallbacks }),
    [direction, showProfile, showAppointment, showPayment, showKnowledge, showFallbacks],
  )

  const conversationNodes = useMemo(() => buildConversationNodes(flowConfig), [flowConfig])
  const baseEdges = useMemo(() => buildBaseEdges(flowConfig), [flowConfig])

  const overlayBundle = useMemo(() => {
    const overlays = flowConfig.overlays ?? []
    const payment = overlays.find(item => item.id === 'payment' && item.enabled !== false)
    const knowledge = overlays.find(item => item.id === 'knowledge' && item.enabled !== false)
    const custom = overlays.filter(item => item.id !== 'payment' && item.id !== 'knowledge' && item.enabled !== false)

    return {
      paymentNodes: payment ? mapOverlayNodes(payment) : [],
      paymentEdges: payment ? mapOverlayEdges(payment) : [],
      knowledgeNodes: knowledge ? mapOverlayNodes(knowledge) : [],
      knowledgeEdges: knowledge ? mapOverlayEdges(knowledge) : [],
      customNodes: custom.flatMap(mapOverlayNodes),
      customEdges: custom.flatMap(mapOverlayEdges),
    }
  }, [flowConfig])

  const { nodes, edges } = useMemo(() => {
    const overlayNodes: FlowNode[] = [
      ...(options.showPayment ? overlayBundle.paymentNodes : []),
      ...(options.showKnowledge ? overlayBundle.knowledgeNodes : []),
      ...overlayBundle.customNodes,
    ]
    const overlayEdges: FlowEdge[] = [
      ...(options.showPayment ? overlayBundle.paymentEdges : []),
      ...(options.showKnowledge ? overlayBundle.knowledgeEdges : []),
      ...overlayBundle.customEdges,
    ]

    return computeDiagramData(options, conversationNodes, baseEdges, overlayNodes, overlayEdges)
  }, [options, conversationNodes, baseEdges, overlayBundle])
  const mermaidDefinition = useMemo(() => generateMermaidDefinition(nodes, edges, direction), [nodes, edges, direction])
  const legendEntries = useMemo(() => buildLegendEntries(nodes), [nodes])

  useEffect(() => {
    let cancelled = false

    async function renderDiagram() {
      try {
        const mermaid = await loadMermaid()

        // Configure theme based on dark mode
        const themeConfig = isDarkMode ? {
          theme: 'dark',
          themeVariables: {
            primaryColor: '#3b82f6',
            primaryTextColor: '#f1f5f9',
            primaryBorderColor: '#60a5fa',
            lineColor: '#60a5fa',
            secondaryColor: '#1e293b',
            tertiaryColor: '#334155',
            background: '#0f172a',
            mainBkg: '#1e293b',
            secondBkg: '#334155',
            textColor: '#f1f5f9',
            secondaryTextColor: '#cbd5e1',
            tertiaryTextColor: '#94a3b8',
            secondaryBorderColor: '#475569',
            tertiaryBorderColor: '#64748b',
            noteBkgColor: '#1e293b',
            noteTextColor: '#f1f5f9',
            noteBorderColor: '#60a5fa',
            actorBorder: '#60a5fa',
            actorBkg: '#1e293b',
            actorTextColor: '#f1f5f9',
            actorLineColor: '#94a3b8',
            labelBoxBkgColor: '#1e293b',
            labelBoxBorderColor: '#60a5fa',
            labelTextColor: '#f1f5f9',
            loopTextColor: '#f1f5f9',
            activationBorderColor: '#60a5fa',
            activationBkgColor: '#3b82f6',
            sequenceNumberColor: '#f1f5f9',
            sectionBkgColor: '#1e293b',
            altBkgColor: '#334155',
            exclBkgColor: '#1e293b',
            taskBorderColor: '#60a5fa',
            taskBkgColor: '#1e293b',
            activeTaskBorderColor: '#60a5fa',
            activeTaskBkgColor: '#3b82f6',
            doneTaskBkgColor: '#334155',
            doneTaskBorderColor: '#94a3b8',
            critBorderColor: '#ef4444',
            critBkgColor: '#991b1b',
            todayLineColor: '#60a5fa',
            gridColor: '#475569',
            doneTaskTextColor: '#94a3b8',
            activeTaskTextColor: '#f1f5f9',
            taskTextColor: '#cbd5e1',
            taskTextOutsideColor: '#cbd5e1',
            taskTextClickableColor: '#60a5fa',
            personBkgColor: '#1e293b',
            personBorderColor: '#60a5fa',
          },
        } : {
          theme: 'neutral',
          themeVariables: {
            primaryColor: '#0f172a',
            lineColor: '#60a5fa',
            secondaryColor: '#1e293b',
            tertiaryColor: '#1f2937',
          },
        }

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          flowchart: { curve: 'basis' },
          ...themeConfig,
        })

        const { svg } = await mermaid.render(`${diagramId}-chart`, mermaidDefinition)
        if (!cancelled) {
          setSvgMarkup(svg)
          setRenderError(null)
        }
      } catch (error) {
        console.error('Failed to render Mermaid diagram', error)
        if (!cancelled) {
          setRenderError('Mermaid rendering failed. Try toggling options or refreshing.')
        }
      }
    }

    if (mermaidDefinition.trim()) {
      void renderDiagram()
    }

    return () => {
      cancelled = true
    }
  }, [diagramId, mermaidDefinition, isDarkMode])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mermaidDefinition)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1600)
    } catch (error) {
      console.error('Failed to copy Mermaid definition', error)
    }
  }

  const handleReset = () => {
    setDirection('LR')
    setShowProfile(true)
    setShowAppointment(true)
    setShowPayment(true)
    setShowKnowledge(true)
    setShowFallbacks(false)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GitBranch className="h-6 w-6 text-green-600" />
                <CardTitle className="text-black">Diagram Controls</CardTitle>
              </div>
              <CardDescription className="text-black">
              Toggle conversation paths to update the generated Mermaid diagram. Copy the snippet to embed the flow in runbooks or
              retrospectives.
              </CardDescription>
            <div className="flex flex-wrap items-center gap-3">
                <Button
                type="button"
                onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
              >
                  <RefreshCw className="h-3 w-3 mr-2" />
                Reset defaults
                </Button>
                <Button
                type="button"
                onClick={() => void fetchConfig()}
                  variant="outline"
                  size="sm"
                  className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
                  disabled={configLoading}
              >
                  <RefreshCw className={`h-3 w-3 mr-2 ${configLoading ? 'animate-spin' : ''}`} />
                  {configLoading ? 'Loading...' : 'Fetch latest'}
                </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-black">
              Direction
              <select
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-black focus:outline-none focus:ring-2 focus:ring-green-600"
                value={direction}
                onChange={event => setDirection(event.target.value as 'LR' | 'TB')}
              >
                <option value="LR">Left → Right</option>
                <option value="TB">Top → Bottom</option>
              </select>
            </label>
              <Button
              type="button"
              onClick={() => setShowFallbacks(value => !value)}
                variant={showFallbacks ? 'default' : 'outline'}
                size="sm"
                className={showFallbacks 
                  ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
                  : 'bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black'
                }
            >
              {showFallbacks ? 'Fallback transitions shown' : 'Show fallback transitions'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="bg-white">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              id: 'profile',
              label: 'Profile Capture',
              description: 'Name, email, and optional phone validation.',
              active: showProfile,
              onToggle: () => setShowProfile(value => !value),
              category: 'profile' as const,
            },
            {
              id: 'appointment',
              label: 'Scheduling Flow',
              description: 'Availability browsing and booking confirmation.',
              active: showAppointment,
              onToggle: () => setShowAppointment(value => !value),
              category: 'appointment' as const,
            },
            {
              id: 'payment',
              label: 'Payment Overlay',
              description: 'Catalog-to-link payment experience.',
              active: showPayment,
              onToggle: () => setShowPayment(value => !value),
              category: 'payment' as const,
            },
            {
              id: 'knowledge',
              label: 'Knowledge / FAQ',
              description: 'Short-circuit answers that conclude the chat.',
              active: showKnowledge,
              onToggle: () => setShowKnowledge(value => !value),
              category: 'knowledge' as const,
            },
          ].map(control => {
            const theme = categoryThemes[control.category]
            return (
                <Card
                key={control.id}
                  className={`relative overflow-hidden cursor-pointer transition-all ${
                    control.active
                      ? 'border-green-600 bg-green-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-green-600 hover:bg-gray-50'
                  }`}
                onClick={control.onToggle}
                >
                  <CardContent className="p-4">
                    <div className="absolute right-4 top-4 h-2 w-2 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <h5 className="text-sm font-semibold text-black">{control.label}</h5>
                    <p className="mt-1 text-xs text-gray-600">{control.description}</p>
                    <Badge
                      variant={control.active ? 'default' : 'outline'}
                      className={`mt-3 ${
                  control.active
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                  {control.active ? 'Included' : 'Hidden'}
                    </Badge>
                  </CardContent>
                </Card>
            )
          })}
        </div>
        {configLoading && (
            <Alert className="mt-4 bg-white border-gray-200">
              <AlertDescription className="text-black">Loading latest configuration…</AlertDescription>
            </Alert>
        )}
        {configError && (
            <Alert className="mt-4 bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">{configError}</AlertDescription>
            </Alert>
        )}
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
              <CardTitle className="text-black">Interactive Mermaid Diagram</CardTitle>
              <CardDescription className="text-black">
              The render updates instantly as you adjust filters. Reveal fallback edges to inspect guard-rail loops.
              </CardDescription>
          </div>
            <Button
            type="button"
            onClick={handleCopy}
              variant="outline"
              size="sm"
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
          >
              {copyState === 'copied' ? <Check className="h-3.5 w-3.5 mr-2" /> : <Copy className="h-3.5 w-3.5 mr-2" />}
            {copyState === 'copied' ? 'Copied' : 'Copy Mermaid code'}
            </Button>
        </div>
        </CardHeader>

        <CardContent className="bg-white">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
            {renderError ? (
                  <div className="flex h-72 items-center justify-center text-sm text-red-600">{renderError}</div>
            ) : (
              <div
                className="mermaid-container overflow-auto"
                style={{ minHeight: '18rem' }}
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />
            )}
              </CardContent>
            </Card>

          <div className="flex flex-col gap-4">
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="p-4">
                  <h5 className="text-sm font-semibold text-black">Legend</h5>
              <ul className="mt-3 space-y-2 text-sm">
                {legendEntries.map(entry => {
                  const theme = categoryThemes[entry.category]
                  return (
                    <li key={entry.category} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-6 rounded-full"
                          style={{ backgroundColor: entry.active ? theme.accent : 'rgba(148,163,184,0.4)' }}
                          aria-hidden
                        />
                            <span className="text-gray-600">{theme.label}</span>
                      </div>
                          <span className="text-xs text-gray-500">{entry.count} node{entry.count === 1 ? '' : 's'}</span>
                    </li>
                  )
                })}
              </ul>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="p-4">
                  <h5 className="text-sm font-semibold text-black">Generated Mermaid Definition</h5>
                  <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-white p-3 text-xs text-gray-600">
                <code>{mermaidDefinition}</code>
              </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
