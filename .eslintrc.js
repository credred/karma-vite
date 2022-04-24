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
  rules: {
    'node/no-missing-import': 'off',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
  },
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
    {
      files: ['examples/**/*'],
      parserOptions: {
        project: './tsconfig.example.json',
      },
      rules: {
        // node/no-unpublished-import can't known sub node_modules, like examples/react/node_modules
        'node/no-unpublished-import': 'off',
        'node/no-unpublished-require': 'off',
      },
    },
  ],
});
