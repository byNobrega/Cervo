import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Cores das categorias de pedido (TEMA_CATEGORIA em src/lib/constants.ts).
  // Como essas classes são montadas dinamicamente em objeto, precisam ficar
  // no safelist senão o Tailwind as remove no build de produção.
  safelist: [
    // verde (Acessórios)
    "bg-green-600", "hover:bg-green-700", "text-green-700", "bg-green-50",
    "border-green-300", "border-green-600", "bg-green-100",
    // sky (Capas)
    "bg-sky-500", "hover:bg-sky-600", "text-sky-700", "text-sky-600",
    "hover:text-sky-700", "bg-sky-50", "border-sky-300", "border-sky-500", "bg-sky-100",
    // laranja (Películas)
    "bg-orange-500", "hover:bg-orange-600", "text-orange-700", "text-orange-600",
    "hover:text-orange-700", "bg-orange-50", "border-orange-300", "border-orange-500", "bg-orange-100",
    // roxo (Material)
    "bg-purple-600", "hover:bg-purple-700", "text-purple-700", "text-purple-600",
    "hover:text-purple-700", "bg-purple-50", "border-purple-300", "border-purple-600", "bg-purple-100",
    // verde — links/badges
    "text-green-600", "hover:text-green-700",
  ],
  theme: {
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
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
