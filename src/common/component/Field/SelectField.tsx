import { Row, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { SimpleSelect } from '../SimpleSelect';

export interface ISelectFieldProps {
  className?: string;
  style?: React.CSSProperties;

  defaultValue?: string;
  value?: string;

  options?: { label: string; value: string }[];
  getOptions?: () => Promise<{ label: string; value: string }[]>;

  onChange?(value: string): any;
}

export const SelectField = ({
  className,
  style,
  options,
  getOptions,
  onChange,
  value,
  defaultValue,
}: ISelectFieldProps) => {
  const [stash, setStash] = useState(value || defaultValue);

  useEffect(() => {
    if (typeof value === 'string') setStash(value);
  }, [value]);

  const handleChange = (v: string) => {
    setStash(v);
    onChange?.(v);
  };

  return (
    <SimpleSelect
      className={className}
      style={style}
      size='small'
      options={options}
      getOptions={getOptions}
      value={stash}
      onChange={handleChange}
    />
  );
};
