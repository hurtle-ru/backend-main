const stylistic = require('@stylistic/eslint-plugin-ts')


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
    "@typescript-eslint/restrict-plus-operands": "error",
    "@typescript-eslint/promise-function-async": "error",
    "@typescript-eslint/prefer-string-starts-ends-with": "error",
    // "@typescript-eslint/require-await": "error",
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
    "brace-style": ["error", "1tbs", { "allowSingleLine": true }],

    "comma-dangle": ["error", {
      "arrays": "always-multiline",
      "objects": "always-multiline",
      "imports": "always-multiline",
      "exports": "always-multiline",
      "functions": "always-multiline",
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
    "space-in-parens": "error",

    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",

    // TODO:
    // "@typescript-eslint/no-empty-function": "error",
    // "@typescript-eslint/no-misused-promises": "error",
    // "@typescript-eslint/no-unnecessary-condition": "error",
    // "@typescript-eslint/no-unsafe-enum-comparison": "error",
    // "no-unused-vars": "off",
    // "@typescript-eslint/no-unused-vars": "error",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
  },
}
