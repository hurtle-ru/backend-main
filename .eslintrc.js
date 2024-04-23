const stylisticis = require('@stylistic/eslint-plugin-ts')


module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: [
    "plugin:@typescript-eslint/recommended",
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [".eslintrc.js", "dist", "node_modules", "src/infrastructure/openapi/postProcessSwagger.js"],
  rules: {
    // "no-unused-vars": "off",
    // "@typescript-eslint/no-unused-vars": "error",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",

    "@typescript-eslint/restrict-plus-operands": "error",
    "@typescript-eslint/promise-function-async": "error",
    "@typescript-eslint/prefer-string-starts-ends-with": "error",
    "@typescript-eslint/require-await": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/no-useless-empty-export": "error",
    "@typescript-eslint/no-unnecessary-qualifier": "error",
    "@typescript-eslint/no-this-alias": "error",
    "@typescript-eslint/no-inferrable-types": "error",
    "@typescript-eslint/no-empty-interface": "error",
    "@typescript-eslint/no-duplicate-enum-values": "error",
    "@typescript-eslint/no-base-to-string": "error",
    "@typescript-eslint/type-annotation-spacing": "error",

    "block-spacing": "error",
    "arrow-spacing": "error",
    "brace-style": "error",

    "comma-dangle": ["error", {
      "arrays": "always",
      "objects": "always",
      "imports": "always",
      "exports": "always",
      "functions": "always",
    }],

    "func-call-spacing": ["error", "never"],
    "keyword-spacing": ["error", { "before": true, "after": true }],
    "lines-between-class-members": ["error", "always"],

    "no-extra-semi": "error",
    "max-len": ["error", { "code": 180 }],
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
    "indent": ["error", 2],
    "space-before-blocks": "error",
    "space-infix-ops": "error",

    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",

    // TODO:
    // "@typescript-eslint/no-empty-function": "error",
    // "@typescript-eslint/no-misused-promises": "error",
    // "@typescript-eslint/no-unnecessary-condition": "error",
    // "@typescript-eslint/no-unsafe-enum-comparison": "error",
  },
}
