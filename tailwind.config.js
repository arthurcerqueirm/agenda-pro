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
          light: '#E8F4FD',
          DEFAULT: '#1A73E8',
          dark: '#1565C0',
        },
        accent: {
          light: '#F0FAF8',
          DEFAULT: '#0D9E8A',
        },
        success: {
          light: '#ECFDF5',
          DEFAULT: '#10B981',
          dark: '#047857',
        },
        danger: {
          light: '#FEF2F2',
          DEFAULT: '#EF4444',
          dark: '#B91C1C',
        },
        warning: {
          light: '#FFFBEB',
          DEFAULT: '#F59E0B',
          dark: '#B45309',
        },
        surface: {
          light: '#F8FAFB',
          neutral: '#F5F5F5',
          DEFAULT: '#F8FAFB',
        },
        dark: {
          DEFAULT: '#1A1A2E',
          muted: '#6B7280',
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
