// rollup.config.js
const resolve = require('@rollup/plugin-node-resolve').default;
const commonjs = require('@rollup/plugin-commonjs');
const esbuild = require('rollup-plugin-esbuild').default;

// modules under src/browser should be built for browser environment.
module.exports = {
  input: 'src/browser/index.ts',
  plugins: [
    resolve({ extensions: ['.ts', '.js', '.mjs'] }),
    commonjs(),
    esbuild({
      include: /\.[jt]sx?$/,
      target: 'esnext',
      tsconfig: 'tsconfig.browser.json',
    }),
  ],
  output: {
    file: 'build/browser.bundle.js',
    format: 'iife',
    name: 'browserBundle',
  },
};
