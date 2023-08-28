import React from 'react';
import { Image2Ktx } from '../../src';

export interface IImage2KtxPageProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Image2KtxPage = ({ className, style }: IImage2KtxPageProps) => {
  return (
    <div data-name='Image2KtxPage' className={className} style={{ width: '100vw', height: '100vh' }}>
      <Image2Ktx />
    </div>
  );
};
