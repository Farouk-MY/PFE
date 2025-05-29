import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript","standard","plugin:tailwindcss/recommended","prettier"),
  {
    rules: {
      // Turn off the base rule as it can report incorrect errors with TypeScript
      "no-unused-vars": "off",
      // Use the TypeScript version instead with customized options
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      // Disable unused modules warnings
      "import/no-unused-modules": "off",
      // Ensure React JSX variables are recognized as used
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error"
    }
  }
];

export default eslintConfig;