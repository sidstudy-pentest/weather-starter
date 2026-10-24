/** @type {import('tailwindcss').Config} */
export default {
  content: {
    relative: true,
    files: ['./index.html', './src/**/*.{ts,tsx}'],
  },
  theme: {
    extend: {
      // `white` and `black` are the theme's ink and ground colors, so the existing
      // `text-white/85`, `bg-white/[0.08]`, etc. classes follow the active theme.
      colors: {
        white: 'rgb(var(--c-fg) / <alpha-value>)',
        black: 'rgb(var(--c-bg) / <alpha-value>)',
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          700: '#0369a1',
        },
      },
      borderRadius: {
        md: 'var(--r-md)',
        lg: 'var(--r-md)',
        '2xl': 'var(--r-lg)',
      },
      backdropBlur: {
        xl: 'var(--blur-card)',
      },
    },
  },
  plugins: [],
};
