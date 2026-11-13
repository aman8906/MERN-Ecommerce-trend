/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#9f2089", dark: "#7a1a69", light: "#fbe8f8", soft: "#fdf4fc" },
        deal: "#ff4d4f",
        good: "#1a9b54",
      },
      keyframes: {
        pulseDot: { "0%,100%": { opacity: 1, transform: "scale(1)" }, "50%": { opacity: 0.4, transform: "scale(1.6)" } },
        fadeIn: { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "none" } },
      },
      animation: { pulseDot: "pulseDot 1.4s ease-in-out infinite", fadeIn: "fadeIn .35s ease both" },
    },
  },
  plugins: [],
};
