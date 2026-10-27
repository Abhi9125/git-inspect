import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vibrant: {
          DEFAULT: '#3074FE',
          hover: '#2461df',
          glow: 'rgba(48, 116, 254, 0.15)',
        },
        dark: {
          bg: '#0c0d0e',
          card: '#141517',
          cardHover: '#18191c',
          border: 'rgba(255, 255, 255, 0.08)',
          muted: '#8b949e',
        },
        authentic: {
          DEFAULT: '#10B981',
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.25)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.25)',
        },
        danger: {
          DEFAULT: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.25)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      boxShadow: {
        'vibrant-glow': '0 0 25px -5px rgba(48, 116, 254, 0.3)',
        'card-subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'card-hover': '0 12px 30px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
