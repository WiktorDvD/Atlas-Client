import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'] },
      colors: {
        ink: {
          950: '#07080c',
          900: '#0e1016',
          800: '#161922',
          700: '#222633'
        }
      }
    }
  },
  plugins: []
} satisfies Config
