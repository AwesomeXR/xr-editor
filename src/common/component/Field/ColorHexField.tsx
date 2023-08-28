import { ColorPicker } from 'antd';
import { type Color } from 'antd/es/color-picker';
import React, { useEffect, useState } from 'react';

/**
 * 每一个值都是 0-1 区间. RGB: 映射到 0-255
 */
type IColorData = number[];

export interface IColorHexFieldProps {
  className?: string;
  style?: React.CSSProperties;

  disableAlpha?: boolean;

  defaultValue?: IColorData;
  value?: IColorData;
  onChange?: (value: IColorData, complete?: boolean) => any;
}

const color2Hex = (color: IColorData) => {
  const rgbaHex = color
    .map(x => (typeof x === 'number' ? Math.floor(x * 255).toString(16) : ''))
    .map(x => (x ? x.padStart(2, '0') : ''))
    .join('');

  return '#' + rgbaHex;
};

export const ColorHexField = ({
  className,
  style,
  defaultValue,
  value,
  onChange,
  disableAlpha,
}: IColorHexFieldProps) => {
  const [stash, _setStash] = useState<IColorData>(value || defaultValue || [1, 1, 1, 1]);

  useEffect(() => {
    if (value && stash[0] === value[0] && stash[1] === value[1] && stash[2] === value[2] && stash[3] === value[3]) {
      return;
    }
    if (value) _setStash(value);
  }, [value]);

  const setStash = (color: IColorData, complete?: boolean) => {
    _setStash(color);
    onChange?.(color, complete);
  };

  const handleChange = (c: Color, complete?: boolean) => {
    const rgba = c.toRgb();
    setStash([rgba.r / 255, rgba.g / 255, rgba.b / 255, typeof rgba.a === 'number' ? rgba.a : 1], complete);
  };

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', ...style }}
    >
      <ColorPicker
        disabledAlpha={disableAlpha}
        size='small'
        format='hex'
        value={color2Hex(stash)}
        onChange={c => handleChange(c)}
        onChangeComplete={c => handleChange(c, true)}
      />
    </div>
  );
};
