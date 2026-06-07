const base = require("./base");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  ...base,
  extends: [
    ...base.extends,
    "next/core-web-vitals",
  ],
  rules: {
    ...base.rules,
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "react/no-unescaped-entities": "off",
  },
};
