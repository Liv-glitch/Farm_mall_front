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
        // Agricultural green colors - tea green and maize green
        agri: {
          50: "#f0f9f0",
          100: "#dcf2dc",
          200: "#bce4bc",
          300: "#8fd18f",
          400: "#5bb55b",
          500: "#3a9a3a", // Main tea green
          600: "#2d7a2d",
          700: "#256125",
          800: "#1f4e1f",
          900: "#1a411a",
        },
        maize: {
          50: "#fefdf0",
          100: "#fef9dc",
          200: "#fdf2bc",
          300: "#fbe78f",
          400: "#f7d55b",
          500: "#f2c23a", // Main maize green
          600: "#e6a82d",
          700: "#c98a25",
          800: "#a46e1f",
          900: "#855a1a",
        },
        // Keep sage for backward compatibility but update to agricultural theme
        sage: {
          50: "#f0f9f0",
          100: "#dcf2dc",
          200: "#bce4bc",
          300: "#8fd18f",
          400: "#5bb55b",
          500: "#3a9a3a", // Updated to tea green
          600: "#2d7a2d",
          700: "#256125",
          800: "#1f4e1f",
          900: "#1a411a",
        },
        // Keep warm for backward compatibility but update to maize
        warm: {
          50: "#fefdf0",
          100: "#fef9dc",
          200: "#fdf2bc",
          300: "#fbe78f",
          400: "#f7d55b",
          500: "#f2c23a", // Updated to maize green
          600: "#e6a82d",
          700: "#c98a25",
          800: "#a46e1f",
          900: "#855a1a",
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
