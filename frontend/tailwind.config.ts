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
        ink: '#170338',
        plum: '#2D1B4E',
        violet: '#6D28D9',
        lilac: '#E8DEFB',
        mist: '#FAF9FD',
        shell: '#F4F3F7',
        silver: '#DAD9DD',
        mint: '#10B981',
        rose: '#EF4444',
      },
      boxShadow: {
        atelier: '0 24px 80px rgba(45, 27, 78, 0.16)',
        card: '0 10px 30px rgba(45, 27, 78, 0.08)',
      },
      fontFamily: {
        sans: ['var(--font-hanken)', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
