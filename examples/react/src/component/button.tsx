import React from 'react';

export interface ButtonProps {
  onClick: React.MouseEventHandler<HTMLElement>;
  children?: React.ReactNode;
  forunCoverageProps?: boolean;
}

const Button: React.FC<ButtonProps> = (props) => {
  if (props.forunCoverageProps) {
    console.log('the line wall not be covered');
  } else {
    console.log('the line will be covered');
  }
  return <button onClick={props.onClick}>{props.children}</button>;
};

export default Button;
