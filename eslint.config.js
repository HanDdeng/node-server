import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import eslintPluginJsonc from "eslint-plugin-jsonc";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["node_modules/*", "dist/*", "cache/*"]
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,json,jsonc}"]
  },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginJsonc.configs["flat/recommended-with-jsonc"],
  // {
  //   files: ["**/*.{vue,ts}"],
  //   languageOptions: { parserOptions: { parser: tseslint.parser } }
  // },
  prettierRecommended,
  {
    plugins: {
      "unused-imports": unusedImports
    },
    rules: {
      "prefer-const": 2,
      "no-use-before-define": 2,
      "unused-imports/no-unused-imports": 2,
      "vue/multi-word-component-names": 0,
      "@typescript-eslint/no-unused-vars": [
        2,
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_"
        }
      ],
      "prettier/prettier": [
        2,
        {
          arrowParens: "avoid",
          trailingComma: "none",
          endOfLine: "lf"
        }
      ]
    }
  }
];
