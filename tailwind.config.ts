import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./@/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // --- redesign tokens (raw vars; supports rgba alphas) ---
        bg: "var(--bg)",
        fg: {
          DEFAULT: "var(--fg)",
          muted: "var(--fg-muted)",
          subtle: "var(--fg-subtle)",
          faint: "var(--fg-faint)",
        },
        surface: {
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
          hover: "var(--surface-hover)",
          inset: "var(--surface-inset)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          soft: "var(--warning-soft)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
        },
        info: {
          DEFAULT: "var(--info)",
          soft: "var(--info-soft)",
        },

        // --- shadcn compat (kept so existing components keep rendering) ---
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
        // Redesign accent uses raw rgba vars (for accent-soft alphas).
        // The shadcn `accent.foreground` is still exposed for legacy components.
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          press: "var(--accent-press)",
          fg: "var(--accent-fg)",
          soft: "var(--accent-soft)",
          "soft-2": "var(--accent-soft-2)",
          text: "var(--accent-text)",
          glow: "var(--accent-glow)",
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

        // explicit borders/strong/accent for redesign
        "border-strong": "var(--border-strong)",
        "border-accent": "var(--border-accent)",
      },
      borderColor: {
        // make `border-border-strong` etc. work
        strong: "var(--border-strong)",
        "accent-soft": "var(--border-accent)",
      },
      borderRadius: {
        xs: "var(--r-xs)",
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
        "2xl": "var(--r-2xl)",
        full: "var(--r-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        pop: "var(--shadow-pop)",
        glow: "0 6px 20px -8px var(--accent-glow)",
      },
      fontFamily: {
        sans: ["Onest", "system-ui", "-apple-system", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SF Mono", "monospace"],
      },
      transitionTimingFunction: {
        ps: "cubic-bezier(0.22,0.61,0.36,1)",
        "ps-out": "cubic-bezier(0.16,1,0.3,1)",
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
        heartBeat: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "ps-rise": {
          from: { transform: "translateY(13px)" },
          to: { transform: "translateY(0)" },
        },
        "ps-fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "ps-pop": {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(6px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "ps-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "ps-sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "ps-caret": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        heartBeat: "heartBeat 0.3s ease-in-out",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.6s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "float-slower": "float 10s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "ps-rise": "ps-rise 0.5s var(--ease-out) both",
        "ps-fade-up": "ps-fade-up 0.5s var(--ease-out) both",
        "ps-pop": "ps-pop 0.28s var(--ease-out) both",
        "ps-float": "ps-float 7s ease-in-out infinite",
        "ps-sheet-up": "ps-sheet-up 0.28s var(--ease-out) both",
        "ps-caret": "ps-caret 1s steps(1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
