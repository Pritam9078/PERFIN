import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',
        panel: '#131313',
        raised: '#1B1B1B',
        line: 'rgba(255,255,255,0.08)',
        lime: { DEFAULT: '#E2FF1F', dim: '#A9BF16', deep: '#4A5410' },
        cyan2: '#1FC8E3',
        coral: '#FF7A6B',
        mute: '#8C8C8C',
      },
      fontFamily: { sans: ['Urbanist', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '28px', chip: '14px' },
      boxShadow: {
        float: '0 1px 0 rgba(255,255,255,0.06) inset, 0 20px 40px -20px rgba(0,0,0,0.8)',
        lift: '0 1px 0 rgba(255,255,255,0.10) inset, 0 30px 60px -20px rgba(0,0,0,0.9)',
      },
    },
  },
  plugins: [],
};
export default config;
