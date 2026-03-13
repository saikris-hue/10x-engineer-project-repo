/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101425",
        mist: "#f4f7fb",
        tide: "#d8e1f0",
        ember: "#ef7f45",
        lagoon: "#0f8b8d",
        signal: "#1f3c88",
      },
      boxShadow: {
        float: "0 24px 60px rgba(16, 20, 37, 0.16)",
      },
    },
  },
  plugins: [],
};
