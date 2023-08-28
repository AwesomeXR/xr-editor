import React from 'react';
import { IDTViewProps } from '../../IFlowNodeEdittimeData';
import { BizField } from '../BizField';

export interface IJSONViewProps extends IDTViewProps {
  className?: string;
  style?: React.CSSProperties;
}

export const JSONView = ({ className, style, ioDef, ioKey, node }: IJSONViewProps) => {
  const value = node.input[ioKey];

  return (
    <BizField.ScriptEditorField
      className={className}
      style={style}
      mode='json'
      defaultValue={JSON.stringify(value, null, 2)}
      onChange={v => {
        node.setInput(ioKey, JSON.parse(v));
      }}
    />
  );
};
