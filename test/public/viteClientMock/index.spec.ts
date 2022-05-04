/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://jestjs.io/"}
 */
import * as output from '@/public/viteClientMock';

describe('viteClientMock', () => {
  it('export correctly', () => {
    expect(output).toMatchSnapshot();
  });
});
