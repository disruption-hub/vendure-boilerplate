/**
 * Design Token System for Admin Dashboard
 * Centralized theme tokens for consistent design across all components
 */

export const theme = {
  // Colors
  colors: {
    // Text colors - all black/dark for maximum contrast
    text: {
      primary: '#000000',      // Pure black for primary text
      secondary: '#1a1a1a',    // Very dark gray for secondary text
      tertiary: '#333333',     // Dark gray for tertiary text
      muted: '#4a4a4a',        // Medium dark gray for muted text
      disabled: '#666666',     // Gray for disabled text
    },
    
    // Background colors
    background: {
      primary: '#ffffff',      // White
      secondary: '#f9fafb',    // Very light gray (gray-50)
      tertiary: '#f3f4f6',     // Light gray (gray-100)
      hover: '#f5f5f5',       // Light gray for hover states
      active: '#e5e7eb',       // Medium light gray (gray-200)
    },
    
    // Primary brand colors (blue)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Status colors
    status: {
      success: {
        light: '#d1fae5',      // green-100
        lightText: '#000000',  // Black text on light success background
        DEFAULT: '#10b981',    // green-500
        defaultText: '#ffffff', // White text on default success background
        dark: '#059669',       // green-600
        darkText: '#ffffff',   // White text on dark success background
        text: '#000000',       // Default text (for light backgrounds)
      },
      error: {
        light: '#fee2e2',      // red-100
        lightText: '#000000',  // Black text on light error background
        DEFAULT: '#ef4444',    // red-500
        defaultText: '#ffffff', // White text on default error background
        dark: '#dc2626',       // red-600
        darkText: '#ffffff',   // White text on dark error background
        text: '#000000',       // Default text (for light backgrounds)
      },
      warning: {
        light: '#fef3c7',      // yellow-100
        lightText: '#000000',  // Black text on light warning background
        DEFAULT: '#f59e0b',    // yellow-500
        defaultText: '#000000', // Black text on default warning background (yellow is light enough)
        dark: '#d97706',       // yellow-600
        darkText: '#000000',   // Black text on dark warning background (yellow is still light)
        text: '#000000',       // Default text (for light backgrounds)
      },
      info: {
        light: '#dbeafe',      // blue-100
        lightText: '#000000',  // Black text on light info background
        DEFAULT: '#3b82f6',    // blue-500
        defaultText: '#ffffff', // White text on default info background
        dark: '#2563eb',       // blue-600
        darkText: '#ffffff',   // White text on dark info background
        text: '#000000',       // Default text (for light backgrounds)
      },
    },
    
    // Border colors
    border: {
      light: '#e5e7eb',        // gray-200
      DEFAULT: '#d1d5db',      // gray-300
      dark: '#9ca3af',         // gray-400
      focus: '#2563eb',        // primary-600
    },
    
    // Icon colors
    icon: {
      primary: '#000000',      // Black icons
      secondary: '#4a4a4a',    // Dark gray icons
      muted: '#6b7280',        // gray-500
      disabled: '#9ca3af',     // gray-400
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],   // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // Spacing (4px base unit)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',  // 4px
    DEFAULT: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    full: '9999px',
  },
  
  // Border width
  borderWidth: {
    DEFAULT: '1px',
    0: '0',
    2: '2px',
    4: '4px',
  },
  
  // Shadows (elevation system)
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // Transitions
  transition: {
    duration: {
      fast: '150ms',
      DEFAULT: '200ms',
      slow: '300ms',
    },
    easing: {
      DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const

export type Theme = typeof theme

