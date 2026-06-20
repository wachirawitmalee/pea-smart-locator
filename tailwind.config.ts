import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // ชี้ไปที่โฟลเดอร์ app ของคุณ
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
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