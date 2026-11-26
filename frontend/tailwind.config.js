/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ethereal: {
          50: '#f6fbf9',
          100: '#eaf5f1',
          200: '#d5ece3',
          300: '#b4ddce',
          400: '#87c7b3',
          500: '#5fab96',
          600: '#468d7c',
          700: '#387164',
          800: '#2f5b52',
          900: '#294c44',
          950: '#152b27',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e5ece5',
          200: '#ceddce',
          300: '#abc4ab',
          400: '#81a482',
          500: '#638664',
          600: '#4c6c4d',
          700: '#3d553e',
          800: '#334434',
          900: '#2c392d',
        },
        ivory: {
          50: '#fdfcf9',
          100: '#fbf8f2',
          200: '#f6f0e3',
          300: '#efe4ce',
          400: '#e4d2b2',
        },
        amberGold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'ethereal-sm': '0 2px 8px -2px rgba(47, 91, 82, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'ethereal': '0 10px 30px -5px rgba(47, 91, 82, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
        'ethereal-lg': '0 20px 40px -10px rgba(47, 91, 82, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.04)',
        'glow-emerald': '0 0 25px -5px rgba(95, 171, 150, 0.35)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
