/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#010102',
        surface: {
          1: '#0f1011',
          2: '#141516',
          3: '#18191a',
          4: '#1c1d1f'
        },
        hairline: {
          DEFAULT: '#23252a',
          strong: '#34343a'
        },
        primary: {
          DEFAULT: '#5e6ad2',
          hover: '#828fff',
          focus: 'rgba(94, 106, 210, 0.25)'
        },
        ink: {
          DEFAULT: '#f7f8f8',
          muted: '#8a8f98',
          subtle: '#62666d'
        },
        semantic: {
          success: '#27a644',
          warning: '#d97706',
          info: '#0ea5e9',
          danger: '#eb5757'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px'
      }
    },
  },
  plugins: [],
};
