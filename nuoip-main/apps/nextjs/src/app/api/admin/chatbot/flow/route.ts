import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'
import { stateCategories, stateShapes, intentLabels } from '@/lib/chatbot/state-machine/metadata'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  try {
    // First try the backend-defined flow config endpoint (source of truth)
    try {
      const backendResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'https://nuoip-production.up.railway.app'}/api/v1/chatbot/flow/config`,
        {
          headers: {
            'Authorization': request.headers.get('Authorization') || '',
          },
        }
      )
      
      if (backendResponse.ok) {
        const data = await backendResponse.json()
        // Transform backend config to frontend FlowConfig format
        if (data.success && data.config) {
          return NextResponse.json({ config: transformBackendConfigToFrontend(data.config) })
        }
      }
    } catch (backendError) {
      console.warn('Backend flow config endpoint not available, trying admin endpoint:', backendError)
    }

    // Fallback to admin endpoint if it exists
    return await proxyToBackend(request, '/api/v1/admin/chatbot/flow')
  } catch (error) {
    console.error('Error proxying chatbot flow config:', error)
    // Return empty config if endpoint doesn't exist
    return NextResponse.json({ config: null }, { status: 200 })
  }
}

// Transform backend flow config to frontend FlowConfig format
function transformBackendConfigToFrontend(backendConfig: any): any {
  // Map backend states to frontend format
  const states: Record<string, any> = {}
  Object.entries(backendConfig.states || {}).forEach(([key, state]: [string, any]) => {
    states[key] = {
      description: state.description || (state as any).description,
    }
  })

  // Map overlays - convert backend overlay format to frontend format
  const overlays = (backendConfig.overlays || []).map((overlay: any) => ({
    id: overlay.id,
    name: overlay.name,
    description: overlay.description,
    enabled: overlay.enabled !== false,
    nodes: (overlay.nodes || []).map((node: any) => ({
      id: node.id,
      title: node.id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      description: node.description,
      category: node.category || 'core',
    })),
    edges: (overlay.edges || []).map((edge: any) => ({
      from: edge.from,
      to: edge.to,
      label: edge.label || '',
      category: edge.category || 'core',
      dashed: edge.dashed || false,
    })),
  }))

  // Map base transitions to edges format (for compatibility)
  const baseEdges = (backendConfig.transitions || []).map((transition: any) => ({
    from: transition.from,
    to: transition.to,
    label: transition.label || '',
    category: transition.category || 'core',
    dashed: transition.dashed || false,
  }))

  // Use backend categories or fallback to metadata defaults
  const categories: Record<string, string> = {}
  Object.keys(states).forEach(key => {
    categories[key] = backendConfig.categories?.[key] || stateCategories[key as keyof typeof stateCategories] || 'core'
  })

  // Use backend shapes or fallback to metadata defaults
  const shapes: Record<string, string> = {}
  Object.keys(states).forEach(key => {
    const shape = backendConfig.shapes?.[key] || stateShapes[key as keyof typeof stateShapes]
    if (shape) {
      shapes[key] = shape
    }
  })

  // Use backend intentLabels or fallback to metadata defaults
  const backendIntentLabels = backendConfig.intentLabels || {}
  const finalIntentLabels: Record<string, string> = { ...intentLabels, ...backendIntentLabels }

  // Load messages and quickActions from backend if stored separately
  const messages = backendConfig.messages || {}
  const quickActions = backendConfig.quickActions || []

  return {
    version: backendConfig.version || 2,
    states,
    overlays,
    categories,
    messages,
    intentLabels: finalIntentLabels,
    shapes,
    quickActions,
    // Include transitions as edges for calibration
    _transitions: baseEdges,
  }
}

// Transform frontend FlowConfig format to backend ChatbotFlowConfig format
function transformFrontendConfigToBackend(frontendConfig: any): any {
  // Extract states
  const states: Record<string, any> = {}
  if (frontendConfig.states) {
    Object.entries(frontendConfig.states).forEach(([key, state]: [string, any]) => {
      const category = frontendConfig.categories?.[key] || 'core'
      states[key] = {
        id: key,
        description: state.description,
        category: category as 'core' | 'profile' | 'appointment' | 'payment' | 'knowledge',
      }
    })
  }

  // Extract transitions from overlays
  const transitions: Array<{ from: string; to: string; label?: string; category?: string; dashed?: boolean }> = []
  if (frontendConfig.overlays) {
    frontendConfig.overlays.forEach((overlay: any) => {
      if (overlay.enabled !== false && overlay.edges) {
        overlay.edges.forEach((edge: any) => {
          transitions.push({
            from: edge.from,
            to: edge.to,
            label: edge.label,
            category: edge.category,
            dashed: edge.dashed,
          })
        })
      }
    })
  }

  // Extract overlays
  const overlays = (frontendConfig.overlays || []).map((overlay: any) => ({
    id: overlay.id,
    name: overlay.name,
    description: overlay.description || '',
    enabled: overlay.enabled !== false,
    nodes: overlay.nodes.map((node: any) => ({
      id: node.id,
      description: node.description,
      category: node.category as 'core' | 'profile' | 'appointment' | 'payment' | 'knowledge',
    })),
    edges: overlay.edges.map((edge: any) => ({
      from: edge.from,
      to: edge.to,
      label: edge.label,
      category: edge.category,
      dashed: edge.dashed,
    })),
  }))

  return {
    version: frontendConfig.version || 2,
    states,
    transitions,
    overlays,
    categories: frontendConfig.categories || {},
    // Store additional fields for frontend use
    messages: frontendConfig.messages || {},
    intentLabels: frontendConfig.intentLabels || {},
    shapes: frontendConfig.shapes || {},
    quickActions: frontendConfig.quickActions || [],
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    
    // Transform frontend config to backend format
    const backendConfig = transformFrontendConfigToBackend(body)
    
    // Proxy to backend with transformed config
    return await proxyToBackend(request, '/api/v1/admin/chatbot/flow', {
      method: 'PUT',
      body: backendConfig,
    })
  } catch (error) {
    console.error('Error updating chatbot flow config:', error)
    return NextResponse.json(
      { error: 'Failed to update chatbot flow configuration' },
      { status: 500 }
    )
  }
}

