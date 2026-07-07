/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        paper: {
          DEFAULT: '#F3ECD8',
          light: '#FBF6EA',
          line: '#D8C9A0',
        },
        ink: '#24301F',
        flame: '#B5482F',
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        'card-settle': {
          '0%': { transform: 'rotate(-2.5deg) translateY(12px)', opacity: '0' },
          '100%': { transform: 'rotate(0deg) translateY(0)', opacity: '1' },
        },
        'stamp-in': {
          '0%': { transform: 'scale(1.4)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'card-settle': 'card-settle 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
        'stamp-in': 'stamp-in 0.18s ease-out both',
      },
    },
  },
  plugins: [],
};
