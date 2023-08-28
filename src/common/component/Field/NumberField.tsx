import { Button, InputNumber } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

export interface INumberFieldProps {
  className?: string;
  style?: React.CSSProperties;

  min?: number;
  max?: number;
  step?: number;

  defaultValue?: number;
  value?: number;
  onChange?(value?: number): any;
}

// FIXME: 太小的数字，antd InputNumber 解析数字精度的时候会报错
const _trim = (v: number) => (Math.abs(v) < 0.0000000000001 ? 0 : v);

export const NumberField = ({ className, style, min, max, step, defaultValue, value, onChange }: INumberFieldProps) => {
  const ref = useRef<HTMLInputElement>(null);

  const __v = value || defaultValue;
  const [stash, setStash] = useState<number | undefined>(typeof __v === 'number' ? _trim(__v) : undefined);

  useEffect(() => {
    if (typeof value === 'number' && value !== stash) setStash(_trim(value));
  }, [value]);

  const handleChange = (v: number | null) => {
    const toSetV = typeof v === 'number' ? v : undefined;
    setStash(toSetV);
    onChange?.(toSetV);
  };

  if (typeof stash === 'undefined') {
    return (
      <Button
        type='dashed'
        size='small'
        block
        className={className}
        style={{ width: '100%', ...style }}
        onClick={() => handleChange(0)}
      >
        未设置
      </Button>
    );
  }

  return (
    <InputNumber
      className={className}
      style={{ width: '100%', ...style }}
      ref={ref}
      value={stash}
      onChange={handleChange}
      onBlur={() => typeof stash === 'number' && onChange?.(stash)}
      onKeyPress={ev => {
        if (ev.key.toLowerCase() === 'enter') {
          typeof stash === 'number' && onChange?.(stash);
          ref.current?.blur();
        }
      }}
      size='small'
      min={min}
      max={max}
      step={step}
    />
  );
};

NumberField._trim = _trim;
