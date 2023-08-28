import React from 'react';
import _Segmented, { SegmentedProps } from 'antd/es/segmented';
import cx from 'classnames';
import './style.less';

export const Segmented = React.forwardRef<any, SegmentedProps>((props, ref) => (
  <_Segmented motionName='x' {...props} ref={ref} className={cx(props.className, 'XUI-Segmented')} />
));
