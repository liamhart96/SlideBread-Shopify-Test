/** @type {import('prettier').Config} */
export default {
  printWidth: 100,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
  semi: true,
  plugins: ["@shopify/prettier-plugin-liquid", "prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./frontend/entrypoints/theme.css",
  overrides: [
    {
      files: "*.liquid",
      options: {
        parser: "liquid-html",
        singleQuote: false,
      },
    },
  ],
};
