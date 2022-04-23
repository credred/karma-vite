import React from 'react';

export interface ButtonProps {
  onClick: React.MouseEventHandler<HTMLElement>;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = (props) => {
  return <button onClick={props.onClick}>{props.children}</button>;
};

export default Button;
