const path = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  build: {
    target: 'node10',
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'lib/index.ts'),
      name: 'karma-vite',
      formats: ['cjs'],
      fileName: () => `index.js`,
    },
    minify: false,
    rollupOptions: {
      external: [
        /node_modules/
      ],
    }
  },
});
