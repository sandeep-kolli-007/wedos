import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
      colors: {
        wedos: {
          ink: "#171717",
          muted: "#737373",
          line: "#e5e5e5",
          canvas: "#fafafa",
          soft: "#f5f5f5",
        },
      },
      boxShadow: {
        panel: "0 1px 2px rgb(0 0 0 / 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
