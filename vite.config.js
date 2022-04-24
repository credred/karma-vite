//@ts-check
const { defineConfig } = require('vite');

module.exports = defineConfig({
  clearScreen: false,
  build: {
    emptyOutDir: false,
    minify: false,
  },
});
