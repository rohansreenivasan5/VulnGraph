import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        black: '#000000',
        red: {
          500: '#FF1E1E',
          600: '#FF3333',
        },
        white: '#FFFFFF',
        gray: {
          400: '#AAAAAA',
          300: '#CCCCCC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'Satoshi', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config 