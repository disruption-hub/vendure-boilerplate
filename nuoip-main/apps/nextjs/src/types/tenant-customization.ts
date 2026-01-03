// Tenant Customization Types
// This defines all customization options available for tenants

export type VantaEffect = 
  | 'fog'
  | 'waves'
  | 'clouds'
  | 'birds'
  | 'net'
  | 'cells'
  | 'trunk'
  | 'topology'
  | 'dots'
  | 'rings'
  | 'halo'
  | 'globe'

export type BackgroundType = 'solid' | 'gradient' | 'particles' | 'vanta'

export interface VantaConfig {
  effect: VantaEffect
  options?: Record<string, any>
}

export interface GradientConfig {
  type: 'linear' | 'radial'
  direction?: string // e.g., 'to bottom', '135deg'
  colors: string[]
  shape?: string
  position?: string
}

export interface ParticleConfig {
  colors: string[]
  count?: number
  minAlpha?: number
}

export interface BackgroundConfig {
  type: BackgroundType
  // For solid backgrounds
  solidColor?: string
  // For gradient backgrounds
  gradient?: GradientConfig
  // For particle backgrounds
  particles?: ParticleConfig
  // For Vanta.js backgrounds
  vanta?: VantaConfig
}

export interface ButtonColors {
  background: string
  hover: string
  text: string
  disabled?: string
}

export interface OtpFormColors {
  inputBorder: string
  inputBorderFocus: string
  inputBackground: string
  inputBackgroundFilled: string
  inputText: string
  inputBorderFilled?: string
}

export interface InputFieldColors {
  background: string
  border: string
  borderFocus: string
  text: string
  placeholder: string
}

export interface TenantCustomization {
  // Background customization
  background: BackgroundConfig
  
  // Button colors
  primaryButton: ButtonColors
  secondaryButton?: ButtonColors
  
  // OTP input styling
  otpForm: OtpFormColors
  
  // Input field styling (phone, email, etc.)
  inputFields: InputFieldColors
  
  // Form container
  formContainer?: {
    background?: string
    border?: string
    shadow?: string
  }
  
  // Text colors
  textColors?: {
    heading?: string
    description?: string
    label?: string
    error?: string
  }
}

// Default customization
export const DEFAULT_CUSTOMIZATION: TenantCustomization = {
  background: {
    type: 'vanta',
    vanta: {
      effect: 'fog',
      options: {
        highlightColor: 0x7bff3a,
        midtoneColor: 0x0c8f72,
        lowlightColor: 0x5ce7c5,
        baseColor: 0x00121a,
        blurFactor: 0.6,
        zoom: 0.8,
        speed: 1.0,
      },
    },
  },
  primaryButton: {
    background: '#25d366',
    hover: '#1ebe5b',
    text: '#171717',
  },
  otpForm: {
    inputBorder: '#b6d9c4',
    inputBorderFocus: '#0c8f72',
    inputBackground: '#ffffff',
    inputBackgroundFilled: '#e9f7ef',
    inputText: '#0f3c34',
    inputBorderFilled: '#0c8f72',
  },
  inputFields: {
    background: '#f5f1ed',
    border: '#d1d5db',
    borderFocus: '#171717',
    text: '#0f172a',
    placeholder: '#64748b',
  },
  formContainer: {
    background: '#ffffff',
    border: 'rgba(255, 255, 255, 0.2)',
    shadow: '0 20px 52px -28px rgba(0,0,0,0.3)',
  },
  textColors: {
    heading: '#111827',
    description: '#4b5563',
    label: '#111827',
    error: '#111827',
  },
}

// Helper to merge customization with defaults
export function mergeCustomization(
  custom?: Partial<TenantCustomization>
): TenantCustomization {
  if (!custom) return DEFAULT_CUSTOMIZATION

  return {
    background: { ...DEFAULT_CUSTOMIZATION.background, ...custom.background },
    primaryButton: { ...DEFAULT_CUSTOMIZATION.primaryButton, ...custom.primaryButton },
    secondaryButton: custom.secondaryButton || DEFAULT_CUSTOMIZATION.secondaryButton,
    otpForm: { ...DEFAULT_CUSTOMIZATION.otpForm, ...custom.otpForm },
    inputFields: { ...DEFAULT_CUSTOMIZATION.inputFields, ...custom.inputFields },
    formContainer: { 
      ...DEFAULT_CUSTOMIZATION.formContainer, 
      ...custom.formContainer 
    },
    textColors: { 
      ...DEFAULT_CUSTOMIZATION.textColors, 
      ...custom.textColors 
    },
  }
}

