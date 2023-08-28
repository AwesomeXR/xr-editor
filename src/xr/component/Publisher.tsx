import React from 'react';

export interface IPublisherProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Publisher = ({ className, style }: IPublisherProps) => {
  return (
    <div data-name='Publisher' className={className} style={style}>
      Publisher
    </div>
  );
};
