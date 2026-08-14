/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF9F43',
          'orange-hover': '#f08d2f',
          slate: '#1E3A44',
          'slate-dark': '#152b33',
          bg: '#F4F6F6',
          cream: '#FFF2E5',
          muted: '#8C9A9E',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'soft-clay': '0 10px 25px -5px rgba(30, 58, 68, 0.08), 0 8px 10px -6px rgba(30, 58, 68, 0.04)',
        'floating': '0 20px 30px -10px rgba(30, 58, 68, 0.2)',
        'glow-orange': '0 8px 20px rgba(255, 159, 67, 0.35)',
      },
    },
  },
  plugins: [],
};
