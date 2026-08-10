/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet warna baru menyesuaikan ikon logo "Jurnal Si Kecil"
        brand: {
          teal: '#01acbf',    // Toska kereta
          orange: '#f47946',  // Oranye teks & gerbong
          yellow: '#FFD166',  // Kuning ceria
          purple: '#9B5DE5',  // Ungu layangan
          cream: '#fffaf5',   // Background dasar lembut ala kanvas
        }
      }
    },
  },
  plugins: [],
}