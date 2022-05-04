import React from 'react';

export interface ButtonProps {
  onClick: React.MouseEventHandler<HTMLElement>;
  children?: React.ReactNode;
  forRealUnCoveredProps?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const Button: React.FC<ButtonProps> = (props) => {
  // for coverage report some line are not covered
  if (props.forRealUnCoveredProps) {
    noop();
  } else {
    noop();
  }
  return <button onClick={props.onClick}>{props.children}</button>;
};

export default Button;
