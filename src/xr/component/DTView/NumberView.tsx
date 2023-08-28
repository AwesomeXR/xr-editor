import React from 'react';
import { IDTViewProps } from '../../IFlowNodeEdittimeData';
import { BizField } from '../BizField';

export interface INumberViewProps extends IDTViewProps {
  className?: string;
  style?: React.CSSProperties;
}

export const NumberView = ({ className, style, ioDef, ioKey, node }: INumberViewProps) => {
  const value = node.input[ioKey];

  if (ioDef.options) {
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

  if (typeof ioDef.min !== 'undefined' && typeof ioDef.max !== 'undefined') {
    return (
      <BizField.SliderField
        className={className}
        style={style}
        value={value}
        min={ioDef.min}
        max={ioDef.max}
        step={ioDef.step}
        onChange={t => node.setInput(ioKey, t)}
      />
    );
  }

  return (
    <BizField.NumberField
      className={className}
      style={style}
      value={value}
      min={ioDef.min}
      max={ioDef.max}
      step={ioDef.step}
      onChange={t => node.setInput(ioKey, t)}
    />
  );
};
