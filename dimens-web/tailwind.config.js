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
        panel: '0 18px 45px rgba(16, 20, 21, 0.12)',
        insetLine: 'inset 0 0 0 1px rgba(16, 20, 21, 0.08)',
      },
      fontFamily: {
        sans: ['Avenir Next', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
