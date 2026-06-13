/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      colors: {
        brand: {
          dark: '#09090b', // zinc-950
          light: '#f4f4f5', // zinc-100
          rose: '#f43f5e', // rose-500
          roseLight: '#ffe4e6', // rose-100
          zinc: '#71717a', // zinc-500
        }
      },
      boxShadow: {
        'luxe': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
