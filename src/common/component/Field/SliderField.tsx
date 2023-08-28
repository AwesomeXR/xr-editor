import { Col, InputNumber, Row, Slider } from 'antd';
import { SliderMarks } from 'antd/es/slider';
import React, { useEffect, useState } from 'react';

export interface ISliderFieldProps {
  className?: string;
  style?: React.CSSProperties;

  min?: number;
  max?: number;
  step?: number;
  masks?: SliderMarks;

  disabled?: boolean;

  defaultValue?: number;
  value?: number;
  onChange?(value: number, complete?: boolean): any;
}

export const SliderField = ({
  className,
  style,
  min = 0,
  max = 1,
  step = 0.1,
  defaultValue,
  value,
  masks,
  onChange,
  disabled,
}: ISliderFieldProps) => {
  const [stash, setStash] = useState(value || defaultValue || 0);

  useEffect(() => {
    if (typeof value === 'number') setStash(value);
  }, [value]);

  const handleChange = (v: number | null, complete?: boolean) => {
    setStash(v || 0);
    onChange?.(v || 0, complete);
  };

  return (
    <Row className={className} style={style} align='middle' gutter={16}>
      <Col span={16}>
        <Slider
          disabled={disabled}
          tooltip={{ open: false }}
          min={min}
          max={max}
          step={step}
          marks={masks}
          value={stash}
          onChange={v => handleChange(v)}
          onAfterChange={v => handleChange(v, true)}
          style={{ margin: 0 }}
        />
      </Col>
      <Col span={8}>
        <InputNumber
          size='small'
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          value={stash}
          onChange={v => handleChange(v, true)}
          style={{ width: '100%' }}
        />
      </Col>
    </Row>
  );
};
