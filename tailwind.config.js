/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // blue-500
        secondary: '#10B981', // emerald-500
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'pulse-delay': 'pulse 3s infinite 1.5s',
        'fadeOut': 'fadeOut 2s forwards',
      },
      keyframes: {
        fadeOut: {
          '0%': { opacity: '1' },
          '75%': { opacity: '1' },
          '100%': { opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}