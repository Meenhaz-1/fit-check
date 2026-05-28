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
        'primary-hot': '#FF6B9D',
        'primary-warm': '#FFB84D',
        'primary-joy': '#6C5CE7',
        'bg-primary': '#FEFAF2',
        'bg-secondary': '#F5F0E8',
        'bg-dark': '#2C2C2C',
        'text-primary': '#2C2C2C',
        'text-secondary': '#6B6B6B',
        'success': '#00D4AA',
        'warning': '#FFB84D',
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
