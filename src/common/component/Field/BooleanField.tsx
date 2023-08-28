import { Switch } from 'antd';
import React, { useEffect, useState } from 'react';
import { InlineCell } from '../InlineCell';

export interface IBooleanFieldProps {
  className?: string;
  style?: React.CSSProperties;

  defaultValue?: boolean;
  value?: boolean;
  onChange?(value: boolean): any;
}

export const BooleanField = ({ className, style, defaultValue, value, onChange }: IBooleanFieldProps) => {
  const [stash, setStash] = useState(value || defaultValue);

  useEffect(() => {
    setStash(!!value);
  }, [value]);

  const handleChange = (v: boolean) => {
    setStash(v);
    onChange?.(v);
  };

  return <Switch className={className} style={style} checked={stash} onChange={handleChange} size='small' />;
};
