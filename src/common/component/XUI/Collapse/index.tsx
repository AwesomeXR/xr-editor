import './style.less';

import React from 'react';
import _Collapse, { CollapseProps } from 'antd/es/collapse';
import cx from 'classnames';

export const Collapse = (p: CollapseProps) => (
  <_Collapse destroyInactivePanel {...p} className={cx(p.className, 'XUI-Collapse')} />
);
Collapse.Panel = _Collapse.Panel;
