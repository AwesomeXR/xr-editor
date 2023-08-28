import './style.less';

import React from 'react';
import cx from 'classnames';
import { type ColorPickerProps } from 'antd';
import _ColorPicker from 'antd/es/color-picker';

export const ColorPicker = (p: ColorPickerProps) => (
  <_ColorPicker {...p} className={cx(p.className, 'XUI-ColorPicker')} />
);
