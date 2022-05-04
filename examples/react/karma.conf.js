require('path');

/** @type {(config: import("karma").Config) => Promise<void> | undefined} */
module.exports = function (config) {
  config.set({
    basePath: './',
    urlRoot: '/test/',
    plugins: [
      'karma-spec-reporter',
      'karma-jasmine',
      'karma-vite',
      'karma-coverage',
    ],
    frameworks: ['jasmine', 'vite'],
    reporters: ['spec'],
    files: [
      {
        pattern: 'test/**/*.spec.tsx',
        type: 'module',
        watched: false,
        served: false,
      },
    ],
  });
};
