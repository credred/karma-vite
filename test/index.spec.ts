import * as output from '@/index';

describe('repo output', () => {
  it('export correctly', () => {
    expect(output).toMatchSnapshot();
  });
});
