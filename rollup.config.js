// rollup.config.js
const resolve = require('@rollup/plugin-node-resolve').default;
const commonjs = require('@rollup/plugin-commonjs');
const esbuild = require('rollup-plugin-esbuild').default;

module.exports = {
  input: 'src/browser/index.ts',
  plugins: [
    resolve({ extensions: ['.ts', '.js', '.mjs'] }), // ①モジュール解決
    commonjs(), // ②CommonJS→ESM
    esbuild({
      // ③TS除去のみ（ESNext出力）
      include: /\.[jt]sx?$/,
      target: 'esnext', // ← ここを esnext に
      tsconfig: 'tsconfig.browser.json',
    }),
  ],
  output: {
    file: 'build/browser.bundle.js',
    format: 'iife',
    name: 'browserBundle',
  },
};
