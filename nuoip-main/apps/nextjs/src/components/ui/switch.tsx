"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--switch-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--switch-focus-offset)] disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:bg-[color:var(--switch-track-active)] data-[state=unchecked]:bg-[color:var(--switch-track-inactive)] data-[state=checked]:border-[color:var(--switch-track-border-active)] data-[state=unchecked]:border-[color:var(--switch-track-border)] data-[state=checked]:shadow-[0_6px_16px_rgba(0,0,0,0.25)] data-[state=unchecked]:shadow-[inset_0_1px_3px_rgba(15,23,42,0.2)]",
  {
    variants: {
      size: {
        default: "h-6 w-11",
        sm: "h-5 w-9",
        lg: "h-7 w-12",
      },
      variant: {
        default: "",
        success:
          "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:shadow-[0_6px_16px_rgba(22,163,74,0.45)]",
        warning:
          "data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500 data-[state=checked]:shadow-[0_6px_16px_rgba(217,119,6,0.35)]",
        destructive:
          "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500 data-[state=checked]:shadow-[0_6px_16px_rgba(239,68,68,0.35)]",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const thumbVariants = cva(
  "pointer-events-none block rounded-full border border-[color:var(--switch-thumb-border)] bg-[color:var(--switch-thumb)] shadow-[0_2px_6px_rgba(15,23,42,0.2)] transition-all duration-200 data-[state=checked]:bg-[color:var(--switch-thumb-active)] data-[state=checked]:border-[color:var(--switch-thumb-border-active)] data-[state=checked]:shadow-[0_3px_8px_rgba(0,0,0,0.3)]",
  {
    variants: {
      size: {
        default: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        sm: "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        lg: "h-6 w-6 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {
  label?: string
  description?: string
  disabled?: boolean
  loading?: boolean
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size, variant, label, description, disabled, loading, ...props }, ref) => (
  <div className="flex items-center space-x-3">
    <SwitchPrimitives.Root
      className={cn(switchVariants({ size, variant }), className)}
      disabled={disabled || loading}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(thumbVariants({ size }))}
      />
    </SwitchPrimitives.Root>
    {(label || description) && (
      <div className="flex flex-col">
        {label && (
          <span className={cn(
            "text-sm font-medium",
            disabled && "text-muted-foreground",
            loading && "text-muted-foreground"
          )}>
            {label}
          </span>
        )}
        {description && (
          <span className={cn(
            "text-xs text-muted-foreground",
            disabled && "text-muted-foreground/70"
          )}>
            {description}
          </span>
        )}
      </div>
    )}
    {loading && (
      <div className="ml-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      </div>
    )}
  </div>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch, switchVariants }
