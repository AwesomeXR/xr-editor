import React, { useEffect, useState } from 'react';
import { useListen } from '../../common/hook/useListen';
import { Deferred } from 'xr-core';
import { useForceUpdate } from '../../common/hook/useForceUpdate';
import { Progress, Typography } from 'antd';

export interface IDeferTaskMonitorProps {
  className?: string;
  style?: React.CSSProperties;

  defer: Deferred<any>;
}

export const DeferTaskMonitor = ({ className, style, defer }: IDeferTaskMonitorProps) => {
  const fu = useForceUpdate();

  useListen(defer.event, 'progressChange', fu.update);

  return (
    <div data-name='DeferTaskMonitor' className={className} style={{ display: 'flex', alignItems: 'center', ...style }}>
      {defer.title && <Typography.Text>{defer.title}</Typography.Text>}
      <Progress
        percent={defer.progress * 100}
        size='small'
        format={pg => (pg ? pg.toFixed(0) + '%' : '')}
        style={{ flex: 1, width: 1, margin: '0 12px 0 8px' }}
      />
    </div>
  );
};
