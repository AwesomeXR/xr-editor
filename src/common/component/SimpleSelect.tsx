import { Select } from 'antd';
import React, { useEffect, useState } from 'react';

export interface ISimpleSelectProps {
  className?: string;
  style?: React.CSSProperties;

  defaultValue?: string;
  value?: string;
  onChange?(value: string): any;
  onBlur?(): any;
  size?: 'large' | 'small' | 'middle';

  options?: { label: string; value: string }[];
  getOptions?: () => Promise<{ label: string; value: string }[]>;

  autoFocus?: boolean;
  defaultOpen?: boolean;
  placeholder?: string;

  allowClear?: boolean;
}

export const SimpleSelect = ({
  className,
  style,
  options,
  getOptions,
  defaultValue,
  value,
  size,
  autoFocus,
  defaultOpen,
  placeholder,
  onChange,
  onBlur,
  allowClear = true,
}: ISimpleSelectProps) => {
  const [finalOptions, setFinalOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    refreshOptions();
  }, []);

  const refreshOptions = () => {
    if (options) setFinalOptions(options);
    else if (getOptions) {
      getOptions().then(_opts => setFinalOptions(_opts));
    }
  };

  return (
    <Select
      allowClear={allowClear}
      placeholder={placeholder}
      autoFocus={autoFocus}
      defaultOpen={defaultOpen}
      className={className}
      style={{ width: '100%', ...style }}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      size={size}
      showSearch
      optionFilterProp='label'
      filterOption={(input, option) => (option as any).label.toLowerCase().indexOf(input.toLowerCase()) >= 0}
      onFocus={refreshOptions}
      onBlur={onBlur}
      options={finalOptions}
    />
  );
};
