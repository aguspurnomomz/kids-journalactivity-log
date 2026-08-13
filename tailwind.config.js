/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#01acbf',    // Toska 
          orange: '#f47946',  // Oranye 
          yellow: '#FFD166',  // Kuning 
          purple: '#9B5DE5',  // Ungu 
          cream: '#fffaf5',   // Background dasar 
        }
      }
    },
  },
  plugins: [],
}