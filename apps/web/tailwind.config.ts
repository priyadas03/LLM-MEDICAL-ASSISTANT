import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 24px rgba(56, 189, 248, 0.35)"
      },
      colors: {
        neon: {
          cyan: "#38bdf8",
          magenta: "#e879f9",
          lime: "#a3e635"
        }
      }
    }
  },
  plugins: []
} satisfies Config;

