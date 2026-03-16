/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './solo_ua.html',
    './self-discovery.html',
    './preview/index.html',
    './style-match/index.html',
    './404.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#faf5ff',
          100: '#f3e8ff',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          900: '#0f172a',
        },
        accent: {
          400: '#facc15',
          500: '#eab308',
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
