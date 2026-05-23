import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
    suspicious: "warn",
    perf: "warn",
  },
  plugins: ["typescript", "import"],
  rules: {
    "typescript/no-extraneous-class": "off",
  },
});
