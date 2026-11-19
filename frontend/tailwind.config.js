/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#4325D6",
        pale: "#E9ECFF",
        ink: "#101044",
      },
    },
  },
  plugins: [],
};