const { pathsToModuleNameMapper } = require('ts-jest');
const tsconfig = require('./tsconfig.test.json');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.test.json',
      },
    ],
  },
  clearMocks: true,
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  testMatch: ['<rootDir>/test/**/?*.spec.[jt]s?(x)'],
  collectCoverageFrom: ['lib/**'],
};
