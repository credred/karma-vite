process.env.CHROME_BIN = require('puppeteer').executablePath();

/** @type {(config: import("karma").Config) => Promise<void> | undefined} */
module.exports = function (config) {
  config.set({
    basePath: './',
    urlRoot: '/vue-test/',
    plugins: [
      'karma-spec-reporter',
      'karma-jasmine',
      'karma-vite',
      'karma-coverage',
      'karma-chrome-launcher',
    ],
    browsers: ['ChromeHeadless'],
    frameworks: ['jasmine', 'vite'],
    reporters: ['spec'],
    files: [
      {
        pattern: 'test/**/*.spec.ts',
        type: 'module',
        watched: false,
        served: false,
      },
    ],
  });
};
