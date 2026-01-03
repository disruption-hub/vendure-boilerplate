import { useEffect } from 'react'
import type { MutableRefObject } from 'react'

interface TypingTarget {
  peerUserId: string
  tenantId: string
}

interface UseTypingEmitterCleanupOptions {
  activeContactId: string | null | undefined
  emitTypingState: (isTyping: boolean, target: TypingTarget) => void
  lastTypingTargetRef: MutableRefObject<TypingTarget | null>
  typingEmitTimeoutRef: MutableRefObject<NodeJS.Timeout | null>
  localTypingStateRef: MutableRefObject<Record<string, boolean>>
}

export function useTypingEmitterCleanup({
  activeContactId,
  emitTypingState,
  lastTypingTargetRef,
  typingEmitTimeoutRef,
  localTypingStateRef,
}: UseTypingEmitterCleanupOptions) {
  useEffect(() => {
    const previousTarget = lastTypingTargetRef.current
    if (previousTarget) {
      emitTypingState(false, previousTarget)
      lastTypingTargetRef.current = null
    }

    localTypingStateRef.current = {}

    if (typingEmitTimeoutRef.current) {
      clearTimeout(typingEmitTimeoutRef.current)
      typingEmitTimeoutRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContactId])

  useEffect(() => {
    return () => {
      const previous = lastTypingTargetRef.current
      if (previous) {
        emitTypingState(false, previous)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
