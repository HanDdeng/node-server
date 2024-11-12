import { defineConfig } from "rollup";

import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import alias from "@rollup/plugin-alias";
import clear from "rollup-plugin-clear";

export default defineConfig({
  // 直接使用rollup打包“带有ts语法的ts文件”报错，通过ts处理成js后打包
  input: "src/index.ts",
  cache: false,
  output: [
    {
      dir: "dist/cjs",
      format: "cjs",
      sourcemap: true,
      entryFileNames: "[name].cjs",
      chunkFileNames: "[name]-[hash].cjs"
    },
    {
      dir: "dist/esm",
      sourcemap: true,
      entryFileNames: "[name].js",
      chunkFileNames: "[name]-[hash].js"
    }
  ],
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      outDir: undefined,
      declaration: false,
      declarationMap: false,
      declarationDir: undefined,
      emitDeclarationOnly: undefined
    }),
    clear({
      targets: ["dist"],
      watch: true
    }),
    alias({
      entries: {
        "@utils": "./src/utils"
      }
    }),
    json(),
    terser(),
    resolve({
      extensions: [".js", ".ts"]
    }),
    commonjs()
  ]
});
