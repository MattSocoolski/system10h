/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './blog/**/*.html',
    './polityka-prywatnosci.html',
    './polityka-prywatnosci-ua.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#0f172a',
        },
        solo: {
          500: '#a855f7',
          600: '#9333ea',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
