/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#E8F4FD',   // Bg Light
          DEFAULT: '#1A73E8', // Primary
          dark: '#1565C0',    // Header/Dark
        },
        accent: {
          light: '#F0FAF8',   // Bg Teal
          DEFAULT: '#0D9E8A', // Accent
        },
        surface: {
          light: '#F8FAFB',   // Fundo Cards
          neutral: '#F5F5F5', // Bordas e Divisores
          DEFAULT: '#F8FAFB',
        },
        danger: {
          DEFAULT: '#E55B5B', // Alerta
        },
        warning: {
          DEFAULT: '#F59E0B', // Destaque (Badge)
        },
        dark: {
          DEFAULT: '#1A1A2E', // Texto Principal
          muted: '#6B7280',   // Texto Secundário
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
        data: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'ios': '20px',
        'ios-lg': '28px',
      },
      boxShadow: {
        'ios': '0 4px 12px rgba(0,0,0,0.05)',
        'ios-hover': '0 8px 24px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
