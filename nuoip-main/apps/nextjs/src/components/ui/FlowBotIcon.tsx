import { cn } from '@/lib/utils'

interface FlowBotIconProps {
  size?: number
  className?: string
  alt?: string
  variant?: 'full' | 'glyph'
  style?: React.CSSProperties
}

export function FlowBotIcon({
  size = 48,
  className,
  alt = 'FlowBot Icon',
  variant = 'full',
  style,
}: FlowBotIconProps) {
  if (variant === 'glyph') {
    const accessibleProps = alt
      ? ({ role: 'img', 'aria-label': alt } as const)
      : ({ 'aria-hidden': true } as const)

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className={cn('text-white', className)}
        style={style}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...accessibleProps}
      >
        <path d="M32 8 C30.5 13 29 17 29 21" />
        <circle cx="32" cy="36" r="19" />
        <circle cx="26" cy="32" r="2.6" fill="currentColor" stroke="none" />
        <circle cx="38" cy="32" r="2.6" fill="currentColor" stroke="none" />
        <path d="M24 40 Q32 46 40 40" />
      </svg>
    )
  }

  // For full variant, we'll use a simple placeholder for now
  return (
    <div
      className={cn('flex items-center justify-center rounded-full bg-[#25d366]', className)}
      style={{ width: size, height: size, ...style }}
      aria-label={alt}
    >
      <span className="text-white font-bold text-lg">FB</span>
    </div>
  )
}
