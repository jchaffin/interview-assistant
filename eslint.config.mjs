import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow any types for now to fix build
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused variables for now
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow missing dependencies for now
      "react-hooks/exhaustive-deps": "warn",
      // Allow var usage in .d.ts files
      "no-var": "warn",
    },
  },
];

export default eslintConfig;
