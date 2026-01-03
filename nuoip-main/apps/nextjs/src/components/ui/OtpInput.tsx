import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { OtpFormColors } from '@/types/tenant-customization'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  className?: string
  colors?: OtpFormColors
  onComplete?: (value: string) => void
}

export function OtpInput({ 
  value, 
  onChange, 
  length = 6, 
  disabled = false, 
  className,
  colors,
  onComplete
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const lastCompletedValue = useRef<string>('')

  useEffect(() => {
    // Update local state when value prop changes
    const newOtp = value.split('').slice(0, length)
    const paddedOtp = [...newOtp, ...new Array(length - newOtp.length).fill('')]
    setOtp(paddedOtp)
    
    // Auto-submit if value is complete and onComplete is provided
    // Only trigger if this is a new complete value (not already submitted)
    if (value.length === length && onComplete && !disabled && value !== lastCompletedValue.current) {
      lastCompletedValue.current = value
      // Use requestAnimationFrame + setTimeout for better cross-device compatibility
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (value.length === length && onComplete && value === lastCompletedValue.current) {
            onComplete(value)
          }
        }, 50) // Small delay to ensure state has settled
      })
    } else if (value.length < length) {
      // Reset the last completed value if code becomes incomplete
      lastCompletedValue.current = ''
    }
  }, [value, length, onComplete, disabled])

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (disabled) return

    const val = element.value
    if (!/^\d*$/.test(val)) return // Only allow digits

    // Check if SMS autocomplete filled the entire code (more than 1 digit)
    if (val.length > 1) {
      // This is likely SMS autocomplete - distribute across all inputs
      const digits = val.replace(/\D/g, '').slice(0, length)
      const newOtp = digits.split('').slice(0, length)
      const paddedOtp = [...newOtp, ...new Array(length - newOtp.length).fill('')]
      setOtp(paddedOtp)
      onChange(digits)
      
      // Auto-submit if all digits are filled
      if (digits.length === length && onComplete) {
        // Use requestAnimationFrame + setTimeout for better cross-device compatibility
        lastCompletedValue.current = digits
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (digits.length === length && onComplete && digits === lastCompletedValue.current) {
              onComplete(digits)
            }
          }, 50)
        })
        return
      }
      
      // Focus the last filled input or the last input
      const nextIndex = Math.min(digits.length - 1, length - 1)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    // Normal single character input
    const newOtp = [...otp]
    newOtp[index] = val.slice(-1) // Only take the last character
    setOtp(newOtp)

    // Update parent component
    const otpString = newOtp.join('')
    onChange(otpString)

    // Auto-submit if all digits are filled
    if (otpString.length === length && onComplete) {
      // Use requestAnimationFrame + setTimeout for better cross-device compatibility
      lastCompletedValue.current = otpString
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (otpString.length === length && onComplete && otpString === lastCompletedValue.current) {
            onComplete(otpString)
          }
        }, 50)
      })
      return
    }

    // Move to next input if current input is filled
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (disabled) return

    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current input is empty, move to previous input
        inputRefs.current[index - 1]?.focus()
      } else {
        // Clear current input
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
        onChange(newOtp.join(''))
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return

    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    
    if (pastedData) {
      const newOtp = pastedData.split('').slice(0, length)
      const paddedOtp = [...newOtp, ...new Array(length - newOtp.length).fill('')]
      setOtp(paddedOtp)
      onChange(pastedData)
      
      // Auto-submit if all digits are filled
      if (pastedData.length === length && onComplete) {
        lastCompletedValue.current = pastedData
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (pastedData.length === length && onComplete && pastedData === lastCompletedValue.current) {
              onComplete(pastedData)
            }
          }, 50)
        })
        return
      }
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(newOtp.length, length - 1)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  // Use custom colors or CSS variables (fallback to hardcoded defaults)
  const inputStyle = (digit: string) => {
    if (colors) {
      return {
        borderColor: digit ? (colors.inputBorderFilled || colors.inputBorderFocus) : colors.inputBorder,
        backgroundColor: digit ? colors.inputBackgroundFilled : colors.inputBackground,
        color: colors.inputText,
      }
    }
    return undefined
  }

  const focusRingColor = colors?.inputBorderFocus || '#0c8f72'

  return (
    <div className={cn('flex gap-2', className)}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={el => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          value={digit}
          onChange={e => handleChange(e.target, index)}
          onInput={e => {
            // Handle iOS autocomplete that might bypass onChange
            const target = e.currentTarget
            if (target.value.length > 1) {
              handleChange(target, index)
            }
          }}
          onKeyDown={e => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          maxLength={index === 0 ? length : 1}
          style={colors ? inputStyle(digit) : undefined}
          className={cn(
            'h-12 w-12 rounded-xl border-2 text-center text-lg font-semibold transition-colors',
            !colors && 'border-[#b6d9c4] bg-white text-[#0f3c34]',
            !colors && 'focus:border-[#0c8f72] focus:outline-none focus:ring-2 focus:ring-[#0c8f72]/30',
            !colors && 'disabled:bg-[#f3fbf7] disabled:text-[#0f3c34]/40 disabled:cursor-not-allowed',
            !colors && digit && 'border-[#0c8f72] bg-[#e9f7ef]',
            colors && 'focus:outline-none focus:ring-2',
            colors && 'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          {...(colors && {
            style: {
              ...inputStyle(digit),
              '--tw-ring-color': `${focusRingColor}30`,
            } as React.CSSProperties,
          })}
        />
      ))}
    </div>
  )
}

