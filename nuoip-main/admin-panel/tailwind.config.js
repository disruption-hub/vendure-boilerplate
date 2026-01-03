const { theme } = require('./src/lib/theme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Text colors - all black/dark for maximum contrast
        text: {
          primary: theme.colors.text.primary,
          secondary: theme.colors.text.secondary,
          tertiary: theme.colors.text.tertiary,
          muted: theme.colors.text.muted,
          disabled: theme.colors.text.disabled,
        },
        // Background colors
        bg: {
          primary: theme.colors.background.primary,
          secondary: theme.colors.background.secondary,
          tertiary: theme.colors.background.tertiary,
          hover: theme.colors.background.hover,
          active: theme.colors.background.active,
        },
        // Primary brand colors
        primary: theme.colors.primary,
        // Status colors
        success: {
          light: theme.colors.status.success.light,
          DEFAULT: theme.colors.status.success.DEFAULT,
          dark: theme.colors.status.success.dark,
          text: theme.colors.status.success.text,
        },
        error: {
          light: theme.colors.status.error.light,
          DEFAULT: theme.colors.status.error.DEFAULT,
          dark: theme.colors.status.error.dark,
          text: theme.colors.status.error.text,
        },
        warning: {
          light: theme.colors.status.warning.light,
          DEFAULT: theme.colors.status.warning.DEFAULT,
          dark: theme.colors.status.warning.dark,
          text: theme.colors.status.warning.text,
        },
        info: {
          light: theme.colors.status.info.light,
          DEFAULT: theme.colors.status.info.DEFAULT,
          dark: theme.colors.status.info.dark,
          text: theme.colors.status.info.text,
        },
        // Border colors
        border: {
          light: theme.colors.border.light,
          DEFAULT: theme.colors.border.DEFAULT,
          dark: theme.colors.border.dark,
          focus: theme.colors.border.focus,
        },
        // Icon colors
        icon: {
          primary: theme.colors.icon.primary,
          secondary: theme.colors.icon.secondary,
          muted: theme.colors.icon.muted,
          disabled: theme.colors.icon.disabled,
        },
      },
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize,
      fontWeight: theme.typography.fontWeight,
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
      borderWidth: theme.borderWidth,
      boxShadow: theme.boxShadow,
      transitionDuration: theme.transition.duration,
      transitionTimingFunction: theme.transition.easing,
    },
  },
  plugins: [],
}
