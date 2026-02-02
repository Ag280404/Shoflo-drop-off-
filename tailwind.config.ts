import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 10px 25px -15px rgba(0, 0, 0, 0.25)'
      }
    }
  },
  plugins: []
};

export default config;
