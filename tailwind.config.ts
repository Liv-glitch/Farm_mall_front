import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#f7fdf4",
          100: "#ecfccb",
          200: "#d9f99d",
          300: "#bef264",
          400: "#a3e635",
          500: "#84cc16",
          600: "#65a30d",
          700: "#4d7c0f",
          800: "#365314",
          900: "#1a2e05",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "#fefaf5",
          100: "#fef3e2",
          200: "#fde4c4",
          300: "#fbcf9b",
          400: "#f8b572",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          50: "#fdf8f6",
          100: "#f2e8e5",
          200: "#eaddd7",
          300: "#e0cec7",
          400: "#d2bab0",
          500: "#bfa094",
          600: "#a18072",
          700: "#8b5a3c",
          800: "#723f2e",
          900: "#5c2e1f",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Agricultural green colors - official brand green #217A2D
        agri: {
          50: "#f0f9f2",
          100: "#dcf2e1",
          200: "#bce4c7",
          300: "#8fd1a3",
          400: "#5bb578",
          500: "#217A2D", // Official brand green
          600: "#1d6d28",
          700: "#195c23",
          800: "#154a1e",
          900: "#113d19",
        },
        maize: {
          50: "#fffef0",
          100: "#fffcdc",
          200: "#fff9bc",
          300: "#fff48f",
          400: "#ffed5b",
          500: "#FFD700", // Official brand gold
          600: "#e6c200",
          700: "#cca000",
          800: "#b38600",
          900: "#996b00",
        },
        // Keep sage for backward compatibility but update to official brand green
        sage: {
          50: "#f0f9f2",
          100: "#dcf2e1",
          200: "#bce4c7",
          300: "#8fd1a3",
          400: "#5bb578",
          500: "#217A2D", // Official brand green
          600: "#1d6d28",
          700: "#195c23",
          800: "#154a1e",
          900: "#113d19",
        },
        // Keep warm for backward compatibility but update to official brand gold
        warm: {
          50: "#fffef0",
          100: "#fffcdc",
          200: "#fff9bc",
          300: "#fff48f",
          400: "#ffed5b",
          500: "#FFD700", // Official brand gold
          600: "#e6c200",
          700: "#cca000",
          800: "#b38600",
          900: "#996b00",
        },
        // Official brand brown #6E3B1E
        brown: {
          50: "#faf8f5",
          100: "#f3ede6",
          200: "#e5d8cc",
          300: "#d4bfad",
          400: "#c1a08c",
          500: "#6E3B1E", // Official brand brown
          600: "#63351b",
          700: "#582e18",
          800: "#4d2715",
          900: "#422012",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
