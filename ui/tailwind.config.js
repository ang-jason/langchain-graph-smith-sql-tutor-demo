/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#1e2120',
          50: '#c8eedd',
          100: '#8a9bc7',
          200: '#5b3f9e',
          300: '#2e3a38',
          400: '#252e2c',
          500: '#1e2120',
          600: '#1a2422',
          700: '#161e1c',
          800: '#111918',
          900: '#0d1412',
        },
        acid: {
          DEFAULT: '#00e5e5',
          50: '#e0fafa',
          100: '#b3f2f2',
          200: '#66e8e8',
          300: '#00e5e5',
          400: '#00cccc',
          500: '#009999',
        },
        ember: {
          DEFAULT: '#e05c5c',
          50: '#fdeaea',
          100: '#f8c0c0',
          200: '#ed8888',
          300: '#e05c5c',
          400: '#c43a3a',
          500: '#992929',
        },
      },
    },
  },
  plugins: [],
}
