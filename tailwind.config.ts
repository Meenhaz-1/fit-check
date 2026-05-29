import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', ...defaultTheme.fontFamily.sans],
        serif: ['var(--font-playfair)', 'Playfair Display', ...defaultTheme.fontFamily.serif],
      },
      colors: {
        // Atelier Digital — surface stack
        'surface': '#fdf8f8',
        'surface-dim': '#ddd9d8',
        'surface-low': '#f7f3f2',
        'surface-container': '#f1edec',
        'surface-high': '#ebe7e6',
        'surface-highest': '#e5e2e1',

        // Text
        'on-surface': '#1c1b1b',
        'on-surface-variant': '#444748',

        // Primary (deep charcoal / black)
        'atelier-primary': '#000000',
        'atelier-on-primary': '#ffffff',

        // Champagne Gold (reserved for premium highlights)
        'atelier-gold': '#D4AF37',
        'atelier-gold-dim': '#cca730',

        // Muted Sage (match scores, compatibility indicators)
        'atelier-sage': '#8A9A8E',

        // Borders
        'outline': '#747878',
        'outline-variant': '#c4c7c7',

        // Semantic
        'error': '#ba1a1a',
        'error-container': '#ffdad6',
        'success': '#4a7c59',

        // Legacy aliases (used by existing API-connected components)
        'primary': '#1c1b1b',
        'primary-dark': '#000000',
        'accent': '#8A9A8E',
        'accent-dark': '#6b7a6f',
        'accent-light': '#e0dfde',
        'text-primary': '#1c1b1b',
        'text-secondary': '#444748',
        'text-tertiary': '#747878',
        'surface-base': '#fdf8f8',
        'surface-elevated': '#f7f3f2',
        'surface-hover': '#f1edec',
        'error-bg': '#ffdad6',
        'divider': '#c4c7c7',
        'border': '#c4c7c7',
      },
      borderRadius: {
        // Atelier Digital: sharp corners throughout
        DEFAULT: '0px',
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '9999px', // circular badges only
      },
      spacing: {
        'section': '120px',
      },
      fontSize: {
        'display': ['64px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-mobile': ['40px', { lineHeight: '1.2' }],
        'headline-lg': ['48px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'headline-md': ['32px', { lineHeight: '1.3' }],
        'headline-sm': ['24px', { lineHeight: '1.4' }],
        'label-caps': ['11px', { lineHeight: '1.0', letterSpacing: '0.12em' }],
      },
      letterSpacing: {
        'caps': '0.1em',
        'btn': '0.05em',
      },
      maxWidth: {
        'atelier': '1280px',
      },
      animation: {
        'slide-up': 'slideUp 400ms ease-out forwards',
        'fade-in': 'fadeIn 500ms ease-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
