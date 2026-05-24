/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Manrope', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(15, 159, 168, 0.12)',
        card: '0 4px 24px rgba(10, 61, 98, 0.08)',
      },
    },
  },
  plugins: [],
};
