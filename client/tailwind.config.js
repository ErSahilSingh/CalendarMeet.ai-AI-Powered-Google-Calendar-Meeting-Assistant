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
        surface: {
          darkest: '#0a0e0d',
          base: '#0d1210',
          card: '#111815',
          elevated: '#16201c',
          panel: 'rgba(17, 24, 21, 0.75)',
          overlay: 'rgba(10, 14, 13, 0.85)',
          hover: '#1a2622',
        },
        accent: {
          DEFAULT: '#22c55e',
          hover: '#16a34a',
          light: '#34d399',
          glow: 'rgba(34, 197, 94, 0.25)',
          muted: 'rgba(34, 197, 94, 0.12)',
          border: 'rgba(34, 197, 94, 0.3)',
        },
        borderGlass: {
          subtle: 'rgba(255, 255, 255, 0.04)',
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          light: 'rgba(255, 255, 255, 0.12)',
          highlight: 'rgba(255, 255, 255, 0.2)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(34, 197, 94, 0.15)',
        'glow-md': '0 0 20px rgba(34, 197, 94, 0.25)',
        'glow-lg': '0 0 30px rgba(34, 197, 94, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
}
