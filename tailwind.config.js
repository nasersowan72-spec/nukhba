/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F17",
        panel: "#111724",
        gold: { 300: "#F4DC8F", 400: "#E6C45C", 500: "#D4AF37", 600: "#AD8628" },
      },
      fontFamily: {
        display: ["Cairo", "system-ui", "sans-serif"],
        body: ["Tajawal", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
