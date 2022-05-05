import React from 'react';
import { Button } from '../src/index';
import { render, fireEvent, screen } from '@testing-library/react';

describe('button test', () => {
  it('button click event', () => {
    const func = jasmine.createSpy();
    render(<Button onClick={func}>123</Button>);
    fireEvent.click(screen.getByText('123'));

    expect(func).toHaveBeenCalled();
  });

  it('button width', () => {
    render(<Button>123</Button>);
    const dom = screen.getByText('123');
    const rect = dom.getBoundingClientRect();
    expect(rect.width).toBe(200);
  });
});
