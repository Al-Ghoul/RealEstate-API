import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      "node_modules/",
      "drizzle.config.ts",
      "eslint.config.mjs",
      "src/tests/",
      "jest.config.ts",
      "babel.config.js",
      "src/db/dropDatabase.ts",
      "generateOpenaiDocs.ts",
      "src/i18n/i18n-node.ts",
      "src/i18n/i18n-util.ts",
    ],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];
