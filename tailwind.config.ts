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
        sans: ['Poppins', ...defaultTheme.fontFamily.sans],
        display: ['Fredoka', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Premium charcoal + teal (magazine aesthetic)
        'primary': '#1F2937',
        'primary-dark': '#111827',
        'accent': '#0D9488',
        'accent-dark': '#0F766E',
        'accent-light': '#CCFBF1',

        // Text colors
        'text-primary': '#1F2937',
        'text-secondary': '#6B7280',
        'text-tertiary': '#9CA3AF',

        // Surface colors
        'surface-base': '#FFFFFF',
        'surface-elevated': '#FAFBFC',
        'surface-hover': '#F3F4F6',

        // Semantic
        'success': '#059669',
        'error': '#DC2626',
        'warning': '#B45309',
        'error-bg': '#FEE2E2',

        // Borders & dividers
        'divider': '#E5E7EB',
        'border': '#D1D5DB',

        // Legacy (kept for backwards compatibility, will deprecate)
        'primary-hot': '#0D9488',
        'primary-warm': '#1F2937',
        'primary-joy': '#6B7280',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FF6B9D 0%, #FFB84D 100%)',
        'gradient-accent': 'linear-gradient(135deg, #6C5CE7 0%, #FF6B9D 100%)',
      },
      animation: {
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'pulse-border': 'pulseBorder 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseBorder: {
          '0%, 100%': { borderColor: '#FF6B9D', opacity: '0.5' },
          '50%': { borderColor: '#FF6B9D', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      spacing: {
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      borderRadius: {
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
      },
    },
  },
  plugins: [],
}

export default config
