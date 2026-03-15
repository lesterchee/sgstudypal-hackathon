// Purpose: Tailwind CSS configuration for the sg-tutor application.
// Extends the default theme with custom colors, fonts, and animations.

import type { Config } from "tailwindcss";

const config: Config = {
  // Purpose: Sprint 63 — class-based dark mode so the sidebar toggle works.
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
