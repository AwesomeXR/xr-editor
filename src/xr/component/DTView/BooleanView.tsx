import React from 'react';
import { IDTViewProps } from '../../IFlowNodeEdittimeData';
import { BizField } from '../BizField';

export interface IBooleanViewProps extends IDTViewProps {
  className?: string;
  style?: React.CSSProperties;
}

export const BooleanView = ({ className, style, ioDef, ioKey, node }: IBooleanViewProps) => {
  return (
    <BizField.BooleanField
      className={className}
      style={style}
      value={node.input[ioKey]}
      onChange={t => node.setInput(ioKey, t)}
    />
  );
};
