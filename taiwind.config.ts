// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        custom: {
          50: "hsl(var(--custom-50) / <alpha-value>)",
          100: "hsl(var(--custom-100) / <alpha-value>)",
          200: "hsl(var(--custom-200) / <alpha-value>)",
          300: "hsl(var(--custom-300) / <alpha-value>)",
          400: "hsl(var(--custom-400) / <alpha-value>)",
          500: "hsl(var(--custom-500) / <alpha-value>)",
          600: "hsl(var(--custom-600) / <alpha-value>)",
          700: "hsl(var(--custom-700) / <alpha-value>)",
          800: "hsl(var(--custom-800) / <alpha-value>)",
          900: "hsl(var(--custom-900) / <alpha-value>)",
        }
      }
    }
  }
}
