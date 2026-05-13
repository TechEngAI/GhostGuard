import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        background: "var(--background)",
        foreground: "var(--foreground)",
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
        "glow-admin": "0 0 40px rgba(8, 80, 65, 0.25)",
        "glow-worker": "0 0 40px rgba(29, 158, 117, 0.25)",
        "glow-hr": "0 0 40px rgba(83, 74, 183, 0.25)",
      },
      animation: {
        "fade-up": "fadeInUp 0.6s ease-out forwards",
        "slide-in-left": "slideInLeft 0.6s ease-out forwards",
        "scale-in": "scaleIn 0.5s ease-out forwards",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "count-up": "fadeInUp 1s ease-out",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(29, 158, 117, 0.4)" },
          "70%": { boxShadow: "0 0 0 15px rgba(29, 158, 117, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(29, 158, 117, 0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
