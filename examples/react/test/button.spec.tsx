import React from 'react';
import { Button } from '../src/index';
import { render, fireEvent, screen } from '@testing-library/react';

describe('button test', () => {
  it('button children', () => {
    const func = jasmine.createSpy();
    render(<Button onClick={func}>123</Button>);
    fireEvent.click(screen.getByText('123'));

    expect(func).toHaveBeenCalled();
  });
});
