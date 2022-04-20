// @ts-check
const { defineConfig } = require('eslint-define-config');
const cjsTsconfig = require('./tsconfig.cjs.json');

module.exports = defineConfig({
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended-module',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  overrides: [
    {
      files: cjsTsconfig.include,
      parserOptions: {
        project: './tsconfig.cjs.json',
      },
      extends: ['plugin:node/recommended-script'],
      // configuration file type is cjs，disable no-var-requires
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },
  ],
});
