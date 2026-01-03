"use client"

import { useEffect, useState } from 'react'
import { Bot, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/stores/toast-store'

interface FlowBotToggleProps {
    sessionToken?: string | null
    tenantId?: string
}

export function FlowBotToggle({ sessionToken, tenantId }: FlowBotToggleProps) {
    const [isFlowBotEnabled, setIsFlowBotEnabled] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [isInitializing, setIsInitializing] = useState(true)
    const [sessionCount, setSessionCount] = useState(0)

    // Fetch current status of all sessions
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setIsInitializing(true)
                const response = await fetch('/api/whatsapp/sessions', {
                    headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
                })

                if (!response.ok) {
                    console.warn('[FlowBotToggle] Failed to fetch sessions')
                    return
                }

                const data = await response.json()
                const sessions = data.sessions || []

                setSessionCount(sessions.length)

                // Check if ANY session has USER_ONLY (if all are USER_ONLY, FlowBot is disabled)
                // If at least one has FLOWBOT_FIRST or FLOWBOT_ONLY, consider FlowBot enabled
                const hasFlowBotEnabled = sessions.some((s: any) =>
                    s.routingRule !== 'USER_ONLY' && s.routingRule !== 'MANUAL'
                )

                setIsFlowBotEnabled(hasFlowBotEnabled)
                console.log('[FlowBotToggle] Sessions:', sessions.length, 'FlowBot enabled:', hasFlowBotEnabled)
            } catch (error) {
                console.error('[FlowBotToggle] Error fetching sessions:', error)
            } finally {
                setIsInitializing(false)
            }
        }

        void fetchSessions()
    }, [sessionToken])

    const handleToggle = async (checked: boolean) => {
        try {
            setIsLoading(true)

            // Determine routing rule based on toggle state
            const routingRule = checked ? 'FLOWBOT_FIRST' : 'USER_ONLY'

            console.log('[FlowBotToggle] Updating ALL sessions to:', routingRule)

            // Update config with 'all' as sessionId to indicate global update
            const response = await fetch('/api/whatsapp/config', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
                },
                body: JSON.stringify({
                    sessionId: 'all', // Special marker for global update
                    routingRule,
                    tenantId,
                }),
            })

            const data = await response.json()

            if (!data.success) {
                toast.error('Error', data.message || 'Failed to update FlowBot settings')
                return
            }

            setIsFlowBotEnabled(checked)

            if (checked) {
                toast.success('🤖 FlowBot Enabled Globally', `FlowBot will respond to all WhatsApp messages automatically (${sessionCount} session${sessionCount !== 1 ? 's' : ''})`)
            } else {
                toast.info('👤 Manual Mode Globally', `Manual responses required for all WhatsApp messages (${sessionCount} session${sessionCount !== 1 ? 's' : ''})`)
            }

            console.log('[FlowBotToggle] ✅ Updated all sessions successfully')
        } catch (error) {
            console.error('[FlowBotToggle] Error updating config:', error)
            toast.error('Error', 'Failed to update FlowBot settings')
        } finally {
            setIsLoading(false)
        }
    }

    // TEMP DEBUG: Always show toggle to diagnose issue
    if (isInitializing) {
        return (
            <div className="flex items-center gap-2 px-2 py-1">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-xs text-gray-400">Cargando...</span>
            </div>
        )
    }

    if (sessionCount === 0) {
        return (
            <div className="flex items-center gap-2 px-2 py-1">
                <Bot className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-400">Sin sesiones</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-3 px-2 py-1">
            <Bot className={`h-4 w-4 ${isFlowBotEnabled ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-xs whitespace-nowrap" style={{ color: 'var(--chatbot-sidebar-text, white)' }}>
                {isFlowBotEnabled ? 'FlowBot' : 'Manual'} ({sessionCount})
            </span>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
            <Switch
                checked={isFlowBotEnabled}
                onCheckedChange={handleToggle}
                disabled={isLoading}
                className="data-[state=checked]:bg-green-600"
            />
        </div>
    )
}
