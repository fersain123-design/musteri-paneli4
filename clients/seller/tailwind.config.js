/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A6A40',
          dark: '#064F32',
          light: '#0F7743',
          gradient: {
            from: '#0A5330',
            to: '#0F7743',
          },
          50: '#E8F5F0',
          100: '#D1EBE1',
          200: '#A3D7C3',
          300: '#75C3A5',
          400: '#47AF87',
          500: '#0A6A40',
          600: '#085533',
          700: '#064F32',
          800: '#043A26',
          900: '#02251A',
        },
        accent: {
          DEFAULT: '#E8A400',
          gold: '#E8A400',
          soft: '#F6CC59',
          50: '#FEF9EC',
          100: '#FDF3D9',
          200: '#FBE7B3',
          300: '#F9DB8D',
          400: '#F7CF67',
          500: '#E8A400',
          600: '#BA8300',
          700: '#8C6200',
          800: '#5E4100',
          900: '#302100',
        },
        background: {
          DEFAULT: '#F6EEDF',
          cream: '#FAF4EB',
          light: '#FAFAFA',
          white: '#FFFFFF',
        },
        text: {
          primary: '#1E1E1E',
          secondary: '#6B7280',
        },
        success: '#10B981',
        warning: '#FACC15',
        error: '#EF4444',
        info: '#3B82F6',
        gray: {
          DEFAULT: '#9CA3AF',
          light: '#E5E7EB',
        },
      },
    },
  },
  plugins: [],
}