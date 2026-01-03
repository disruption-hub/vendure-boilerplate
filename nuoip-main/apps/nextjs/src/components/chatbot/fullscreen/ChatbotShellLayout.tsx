import type { CSSProperties, ReactNode } from 'react'

interface ChatbotShellLayoutProps {
  themeId: string
  containerHeight: number | string
  viewportOffsetTop?: number | null
  children: ReactNode
  dialogs?: ReactNode
  isSettingsPanelOpen?: boolean
}

export function ChatbotShellLayout({
  themeId,
  containerHeight,
  viewportOffsetTop,
  children,
  dialogs,
  isSettingsPanelOpen = false,
}: ChatbotShellLayoutProps) {
  const normalizedHeight = typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight

  const layoutStyle: CSSProperties = {
    height: normalizedHeight,
    minHeight: normalizedHeight,
    maxHeight: normalizedHeight,
    touchAction: 'manipulation',
    transform: viewportOffsetTop ? `translateY(${viewportOffsetTop}px)` : undefined,
    backgroundColor: '#ffffff',
    WebkitTapHighlightColor: 'transparent',
    WebkitOverflowScrolling: 'touch',
    '--chat-app-height': normalizedHeight,
  } as CSSProperties

  const contentStyle: CSSProperties = {
    WebkitOverflowScrolling: 'touch',
  }

  return (
    <>
      <div
        className="chatbot-theme mobile-app-container fixed inset-x-0 top-0 flex w-full flex-col overflow-hidden md:relative md:min-h-screen md:flex-row"
        data-chat-theme={themeId}
        style={layoutStyle}
      >
        <div
          className="mobile-app-main relative flex h-full w-full flex-1 flex-col overflow-hidden md:flex-row"
          style={contentStyle}
        >
          {children}
        </div>
      </div>
      {dialogs}
    </>
  )
}
