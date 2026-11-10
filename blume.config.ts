import { defineConfig } from "blume";

const releases = "https://github.com/opsis-dev/opsis/releases/latest";

export default defineConfig({
  title: "Opsis",
  description: "Record a real website or terminal and turn it into a polished product demo.",
  logo: "/logo.svg",
  deployment: { site: "https://opsis.dev" },
  theme: {
    mode: "dark",
    toggle: false,
    accent: "#fc6b33",
    background: { dark: "#0b0b0e" },
    radius: "md",
    fonts: {
      display: { name: "Archivo", provider: "fontsource", weights: ["100..900"] },
      body: { name: "Instrument Sans", provider: "fontsource", weights: ["400..700"] },
      mono: "geist-mono",
    },
  },
  navigation: {
    actions: [
      { href: "/docs", label: "Docs" },
      { href: "https://github.com/opsis-dev/opsis", label: "GitHub" },
    ],
    cta: { href: releases, label: "Download" },
  },
});
