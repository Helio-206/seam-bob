import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#090b10",
        panel: "#10141c",
        line: "#242c39",
        cyan: "#8be9fd",
        signal: "#b8f36b",
        danger: "#ff6b6b",
      },
      boxShadow: {
        signal: "0 0 42px rgba(184, 243, 107, .12)",
        danger: "0 0 42px rgba(255, 107, 107, .13)",
      },
    },
  },
  plugins: [],
};

export default config;
