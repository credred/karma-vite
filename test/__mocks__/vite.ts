import { createServerMock } from '../_utils/mockFn';

const vite = jest.requireActual('vite');
module.exports = {
  ...vite,
  createServer: createServerMock,
};

export {};
