/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        'primary-light': '#EEF0FF',
        accent: '#FF6584',
        success: '#00C9A7',
        warning: '#F0A500',
        danger: '#FF6B6B',
        surface: '#F4F5F9',
        card: '#FFFFFF',
        muted: '#6B7280',
        subtle: '#9CA3AF',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
