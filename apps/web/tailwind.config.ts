import type { Config } from "tailwindcss";
import sharedConfig from "@apibazar/tailwind-config/tailwind.config";

const config: Config = {
  presets: [sharedConfig],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./ui/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/blocks/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        // Custom animations
        "infinite-scroll": "infinite-scroll 22s linear infinite",
        "infinite-scroll-y": "infinite-scroll-y 22s linear infinite",
        "text-appear": "text-appear 0.15s ease",
        "table-pinned-shadow": "table-pinned-shadow cubic-bezier(0, 0, 1, 0)",
        "caret-blink": "caret-blink 1s ease-out infinite",
        "pulse-scale": "pulse-scale 6s ease-out infinite",
        "gradient-move": "gradient-move 5s linear infinite",
      },
      keyframes: {
        "infinite-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(var(--scroll, -150%))" },
        },
        "infinite-scroll-y": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(var(--scroll, -150%))" },
        },
        "text-appear": {
          "0%": { opacity: "0", transform: "rotateX(45deg) scale(0.95)" },
          "100%": { opacity: "1", transform: "rotateX(0deg) scale(1)" },
        },
        "table-pinned-shadow": {
          "0%": { filter: "drop-shadow(rgba(0, 0, 0, 0.1) -2px 10px 6px)" },
          "100%": { filter: "drop-shadow(rgba(0, 0, 0, 0) -2px 10px 6px)" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "0" },
          "20%,50%": { opacity: "1" },
        },
        "pulse-scale": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "30%": { opacity: "1" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        "gradient-move": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
    },
  },
};

export default config;
