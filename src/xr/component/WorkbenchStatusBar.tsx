import React, { useContext } from 'react';
import { PerformanceMonitor } from './PerformanceMonitor';
import { Divider, Space } from 'antd';
import { CommandButton } from './CommandButton';
import { XREditorContext } from '../XREditorContext';
import { useForceUpdate, useListen } from '../../common';

export interface WorkbenchStatusBar {
  className?: string;
  style?: React.CSSProperties;
}

export const WorkbenchStatusBar = ({ className, style }: WorkbenchStatusBar) => {
  const ctx = useContext(XREditorContext);
  const fu = useForceUpdate();

  useListen(ctx.project.event, 'afterPauseChange', fu.update);

  return (
    <Space split={<Divider type='vertical' />}>
      <PerformanceMonitor />
      <CommandButton command='Pause' size='small' type={ctx.project.pause ? 'primary' : 'text'}>
        {ctx.project.pause ? '暂停中' : '暂停'}
      </CommandButton>
    </Space>
  );
};
