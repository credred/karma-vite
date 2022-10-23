/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://jestjs.io/"}
 */
const envMock = jest.fn();
jest.mock(
  '@vite/env',
  () => {
    envMock();
  },
  { virtual: true },
);

import * as output from '@/public/viteClientMock';

describe('viteClientMock', () => {
  it('export correctly', () => {
    expect(output).toMatchSnapshot();
  });

  it('imported @vite/env', () => {
    jest.resetModules();
    require('@/public/viteClientMock');

    expect(envMock).toHaveBeenCalled();
  });
});
