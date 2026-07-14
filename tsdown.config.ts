import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'index.ts',
    browser: 'src/browser.ts',
  },
  format: 'esm',
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  deps: {
    neverBundle: [],
  },
});
