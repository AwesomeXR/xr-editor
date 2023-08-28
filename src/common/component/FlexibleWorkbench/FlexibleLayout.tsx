import React, { useContext } from 'react';
import { FlexibleComponent } from './FlexibleComponent';
import { FlexibleSplit } from './FlexibleSplit';
import { FWContext } from './FWContext';

export interface IFlexibleLayoutProps {
  className?: string;
  style?: React.CSSProperties;
}

export const FlexibleLayout = ({ className, style }: IFlexibleLayoutProps) => {
  const ctx = useContext(FWContext);
  const layout = ctx.currentLayout;

  if (layout.type === 'Component') return <FlexibleComponent key={layout.key} className={className} style={style} />;
  if (layout.type === 'Split') return <FlexibleSplit key={layout.key} className={className} style={style} />;

  return null;
};
