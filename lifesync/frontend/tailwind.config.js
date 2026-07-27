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
        brand: {
          DEFAULT: '#FF5A36', // coral
          light: '#FF7C60',
          dark: '#E04320',
        },
        candy: {
          tasks: '#FF5A36', // coral
          goals: '#8B5CF6', // violet
          habits: '#10B981', // green
          expenses: '#F59E0B', // amber
          notes: '#14B8A6', // teal
          calendar: '#6366F1', // indigo
        },
        cream: {
          light: '#FFFDF9',
          DEFAULT: '#FDFBF7',
          dark: '#F7F3EB',
        },
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          800: '#1F2937',
          900: '#111827',
          950: '#0B0F19', // Near-black navy background
        }
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'retro-sm': '2px 2px 0px 0px rgba(0, 0, 0, 1)',
        'retro': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'retro-lg': '6px 6px 0px 0px rgba(0, 0, 0, 1)',
        // Colored shadow utilities for the modules
        'retro-tasks': '4px 4px 0px 0px #FF5A36',
        'retro-goals': '4px 4px 0px 0px #8B5CF6',
        'retro-habits': '4px 4px 0px 0px #10B981',
        'retro-expenses': '4px 4px 0px 0px #F59E0B',
        'retro-notes': '4px 4px 0px 0px #14B8A6',
        'retro-calendar': '4px 4px 0px 0px #6366F1',
      }
    },
  },
  plugins: [],
}
