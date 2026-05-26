/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#101415',
          900: '#182022',
          800: '#243034',
          700: '#334146',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        copper: {
          500: '#b86e3c',
          400: '#d18955',
        },
        moss: {
          600: '#4e6d5c',
          500: '#638471',
          100: '#e7eee9',
        },
      },
      boxShadow: {
        panel: '0 18px 50px rgba(15, 23, 42, 0.08)',
        lift: '0 12px 28px rgba(37, 99, 235, 0.12)',
        insetLine: 'inset 0 0 0 1px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        sans: ['Avenir Next', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
