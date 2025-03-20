export default [
  {
    ignores: ["node_modules/**", "dist/**"],
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    rules: {
      "no-unused-vars": "warn",
      "no-console": "warn",
      "semi": "error"
    }
  }
];
