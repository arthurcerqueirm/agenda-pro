/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#B5D4F4',   // Avatares
          DEFAULT: '#1A73E8', // Cor primária
          dark: '#1565C0',    // Admin header
        },
        accent: {
          bg: '#F0FAF8',      // Bg teal
          DEFAULT: '#0D9E8A', // Em dia, sucesso
        },
        surface: {
          light: '#E8F4FD',   // Bg light
          DEFAULT: '#F8FAFB', // Fundo cards
          neutral: '#F5F5F5', // Fundo alternativo
        },
        danger: {
          light: '#FEE2E2',   // Fundo de erro
          DEFAULT: '#E55B5B', // Cancelar / Alerta
          dark: '#DC2626',    // Hover de alerta
        },
        warning: {
          DEFAULT: '#F59E0B', // Inadimplente
        },
        dark: {
          DEFAULT: '#1A1A2E',
          muted: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
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
