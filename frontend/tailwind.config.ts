import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./context/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1D9E75",
          dark: "#085041",
          light: "#E1F5EE",
        },
        admin: "#085041",
        worker: "#1D9E75",
        hr: "#534AB7",
        background: "#F8F7F2",
        surface: "#FFFFFF",
        border: "#E0DED6",
        ink: {
          DEFAULT: "#1A1A1A",
          secondary: "#555555",
          tertiary: "#888888",
        },
        danger: {
          DEFAULT: "#A32D2D",
          light: "#FCEBEB",
        },
        warning: {
          DEFAULT: "#BA7517",
          light: "#FAEEDA",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 60px rgba(8, 80, 65, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
