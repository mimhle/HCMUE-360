/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      animation: {
        'pulse-btn': 'pulse-btn 1.5s linear infinite',
      },
      colors: {
        primary: 'rgba(var(--color-primary), <alpha-value>)',
        secondary: 'rgba(var(--color-secondary), <alpha-value>)',
        surface: 'rgba(var(--color-surface), <alpha-value>)',
      }
    },
  },
  plugins: [],
}

