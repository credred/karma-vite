import { Button } from '../src/index';
import { mount } from '@vue/test-utils';

describe('button test', () => {
  it('button children', () => {
    const func = jasmine.createSpy();
    const wrapper = mount(Button, {
      props: {
        onClick: func,
      },
      slots: {
        default: () => '123',
      },
    });
    void wrapper.trigger('click');

    expect(func).toHaveBeenCalled();
    expect(wrapper.text()).toBe('123');
  });
});
