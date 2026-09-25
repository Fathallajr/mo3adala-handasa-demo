/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['TheYearofHandicrafts', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#ff4d00',
        primaryDark: '#cc3e00',
        body: '#0f172a',
        surface: '#fffaf7',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
