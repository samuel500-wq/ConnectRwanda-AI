import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cr: {
          primary: 'var(--cr-primary)',
          primaryDark: 'var(--cr-primary-600)',
          accent: 'var(--cr-accent)',
          accentWarm: 'var(--cr-accent-warm)',
          ink: 'var(--cr-ink)',
          muted: 'var(--cr-ink-muted)',
          surface: 'var(--cr-surface)',
          surfaceMuted: 'var(--cr-surface-muted)',
          border: 'var(--cr-border)',
        },
      },
      borderRadius: {
        pill: 'var(--cr-radius-pill)',
      },
    },
  },
  plugins: [],
};

export default config;
