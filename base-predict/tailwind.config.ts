import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          blue: "#0052FF",
          "blue-hover": "#003ECF",
        },
        acid: "#D4FF3A",
        amber: "#F5A623",
        surface: {
          "0": "#0A0A0A",
          "1": "#111111",
          "2": "#1A1A1A",
          "3": "#222222",
        },
        bone: "rgba(245, 242, 234, 1)",
        "bone-muted": "rgba(245, 242, 234, 0.6)",
        "bone-faint": "rgba(245, 242, 234, 0.1)",
      },
      fontFamily: {
        clash: ["Clash Display", "sans-serif"],
        satoshi: ["Satoshi", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 255, 58, 0.4)" },
          "50%": { boxShadow: "0 0 20px 4px rgba(212, 255, 58, 0.15)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "count-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-up-1": "fade-up 0.6s ease-out 0.1s forwards",
        "fade-up-2": "fade-up 0.6s ease-out 0.2s forwards",
        "fade-up-3": "fade-up 0.6s ease-out 0.3s forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        "count-pulse": "count-pulse 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
