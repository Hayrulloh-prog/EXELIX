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
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#CC3033',
          600: '#CC3033',
          700: '#CC3033',
          800: '#CC3033',
          900: '#CC3033',
        },
        dark: {
          50: '#FFFFFF',
          100: '#FFFFFF',
          200: '#FFFFFF',
          300: '#FFFFFF',
          400: '#FFFFFF',
          500: '#FFFFFF',
          600: '#FFFFFF',
          700: '#FFFFFF',
          800: '#FFFFFF',
          900: '#18171C',
        },
      },
    },
  },
  plugins: [],
}
