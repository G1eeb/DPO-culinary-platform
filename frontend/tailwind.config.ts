import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F1ECE3',
        surface: '#FFFFFF',
        'surface-2': '#F6F1E8',
        'surface-3': '#F3EEE5',
        border: '#E7E1D6',
        'border-2': '#E1DACC',
        text: '#2B2924',
        'text-2': '#6B6659',
        'text-3': '#9A9486',
        'text-4': '#A8A294',
        accent: '#7E8C6E',
        'accent-dark': '#5F6B52',
        'accent-bg': '#EAEDE4',
        'accent-bg-2': '#CFD6BF',
        star: '#C8923D',
        terracotta: '#B5654A',
      },
      fontFamily: {
        lora: ['Lora', 'Georgia', 'serif'],
        manrope: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        'card-lg': '18px',
        btn: '9px',
        'btn-lg': '11px',
        badge: '6px',
      },
      boxShadow: {
        card: '0 14px 30px -14px rgba(50,45,35,0.3)',
        popup: '0 16px 40px -14px rgba(40,36,28,0.4)',
      },
    },
  },
  plugins: [],
} satisfies Config
