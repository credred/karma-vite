import { Button } from '../src/index';
import { mount } from '@vue/test-utils';

beforeEach(() => {
  document.body.innerHTML = `
  <div>
    <div id="app"></div>
  </div>
`;
});

describe('button test', () => {
  it('button click event', () => {
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

  it('button width', () => {
    const wrapper = mount(Button, { attachTo: '#app' });
    const rect = wrapper.element.getBoundingClientRect();

    expect(rect.width).toBe(200);
  });
});
