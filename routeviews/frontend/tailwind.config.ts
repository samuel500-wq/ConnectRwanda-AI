import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#101114',
          50: '#F3F5F8',
          100: '#8A919F',
        },
        navy: { DEFAULT: '#14213D', 700: '#1E2E52', 800: '#172444', 900: '#0D1730' },
        electric: { DEFAULT: '#2563EB', 600: '#1D4ED8', 700: '#1E40AF' },
        teal: { DEFAULT: '#0F9D91', 600: '#0C857A', 700: '#096B61' },
        mint: { DEFAULT: '#A7F3D0' },
        amber: { DEFAULT: '#F59E0B', 600: '#D97706' },
        danger: { DEFAULT: '#DC2626', 600: '#B91C1C' },
        surface: '#FFFFFF',
        canvas: '#F3F5F8',
        border: { DEFAULT: '#E4E7EC', strong: '#C9CFD8' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { card: '14px', pill: '999px' },
      boxShadow: {
        card: '0 1px 3px rgba(16,17,20,0.06), 0 8px 24px rgba(16,17,20,0.04)',
        lift: '0 10px 40px rgba(16,17,20,0.10)',
        focus: '0 0 0 3px rgba(37,99,235,0.25)',
      },
      animation: {
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
    },
  },
  plugins: [],
};

export default config;