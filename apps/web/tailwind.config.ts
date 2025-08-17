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
    extend: {},
  },
};

export default config;
