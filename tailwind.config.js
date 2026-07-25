/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#EC4899',
          'pink-hover': '#DB2777',
          secondary: '#F9A8D4',
          accent: '#F472B6',
          border: '#FBCFE8',
          bg: '#FFF7FB',
          green: '#22C55E',
          red: '#EF4444',
          orange: '#F59E0B',
        },
        surface: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          hover: 'rgba(255,255,255,0.07)',
          active: 'rgba(255,255,255,0.10)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
        'gradient-purple': 'linear-gradient(135deg, #DB2777 0%, #F9A8D4 100%)',
        'gradient-neon': 'linear-gradient(135deg, #F472B6 0%, #F9A8D4 100%)',
        'gradient-dark': 'linear-gradient(135deg, #3F1030 0%, #4A1942 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow': 'glow 2s ease-in-out infinite',
        'scan-line': 'scanLine 2s linear infinite',
        'count-up': 'countUp 1s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(-24px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.6)' },
        },
        scanLine: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(236, 72, 153, 0.4), 0 0 60px rgba(236, 72, 153, 0.15)',
        'neon-purple': '0 0 20px rgba(244, 114, 182, 0.4), 0 0 60px rgba(244, 114, 182, 0.15)',
        'neon-green': '0 0 20px rgba(34, 197, 94, 0.4)',
        'neon-red': '0 0 20px rgba(239, 68, 68, 0.4)',
        'glass': '0 8px 32px rgba(236, 72, 153, 0.10), inset 0 1px 0 rgba(255,255,255,0.6)',
        'glass-lg': '0 24px 64px rgba(236, 72, 153, 0.14), inset 0 1px 0 rgba(255,255,255,0.5)',
        'card': '0 4px 24px rgba(236, 72, 153, 0.10)',
        'pink': '0 8px 24px -6px rgba(236, 72, 153, 0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
