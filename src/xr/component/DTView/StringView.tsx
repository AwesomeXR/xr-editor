import React from 'react';
import { IDTViewProps } from '../../IFlowNodeEdittimeData';
import { BizField } from '../BizField';

export interface IStringViewProps extends IDTViewProps {
  className?: string;
  style?: React.CSSProperties;
}

export const StringView = ({ className, style, ioDef, ioKey, node }: IStringViewProps) => {
  const value = node.input[ioKey];

  if (ioDef.options && ioDef.options.length > 0) {
    return (
      <BizField.SelectField
        className={className}
        style={style}
        value={value}
        onChange={t => node.setInput(ioKey, t)}
        options={ioDef.options}
      />
    );
  }

  return (
    <BizField.StringField className={className} style={style} value={value} onChange={t => node.setInput(ioKey, t)} />
  );
};
