const path = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    target: 'node10',
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'lib/main.ts'),
      name: 'karma-vite',
      formats: ['cjs'],
      fileName: (format) => `karma-vite.${format}.js`,
    },
  },
});
