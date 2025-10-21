/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f3',
          100: '#dcf2e3',
          200: '#bce5cb',
          300: '#8dd2a7',
          400: '#57b67c',
          500: '#339959',
          600: '#226533', // Main brand color
          700: '#1e5129',
          800: '#1a4023',
          900: '#16331d',
        },
        restaurant: {
          green: '#226533',
          lightGreen: '#2d8f47',
          orange: '#d4380d',
          lightOrange: '#ff7a45',
        }
      },
      fontFamily: {
        //sans: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['"Nunito Sans"', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'], // nếu dùng cả 2 loại
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.06)',
        'soft-lg': '0 4px 12px rgba(0,0,0,0.08)',
        'soft-xl': '0 8px 24px rgba(0,0,0,0.12)',
        'brand': '0 4px 12px rgba(34, 101, 51, 0.25)',
        'brand-lg': '0 6px 16px rgba(34, 101, 51, 0.35)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  // Quan trọng: không override styles của Ant Design
  corePlugins: {
    preflight: false, // Tắt reset CSS của Tailwind để không conflict với Ant Design
  }
}