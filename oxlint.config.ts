import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
    suspicious: "warn",
    perf: "warn",
  },
  plugins: ["typescript", "import"],
  rules: {
    "eslint/no-unused-vars": "off",
    "typescript/no-unused-vars": "off",
    "typescript/no-extraneous-class": "off",
  },
});
