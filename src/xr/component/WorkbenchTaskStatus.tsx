import { Space, Typography } from 'antd';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { XREditorContext } from '../XREditorContext';
import { DeferTaskMonitor } from './DeferTaskMonitor';
import { useListen } from '../../common/hook/useListen';
import { Deferred } from 'xr-core';

export interface IWorkbenchTaskStatusProps {
  className?: string;
  style?: React.CSSProperties;
}

export const WorkbenchTaskStatus = ({ className, style }: IWorkbenchTaskStatusProps) => {
  const ctx = useContext(XREditorContext);

  const timerRef = useRef<any>();
  const [monitorDefer, setMonitorDefer] = useState<Deferred<any>>();

  useListen(ctx.command.event, 'execute:beforeInvoke', ({ defer }) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // 300ms 后再显示进度条(防抖)
    timerRef.current = setTimeout(() => setMonitorDefer(defer), 300);
  });

  useListen(ctx.command.event, 'execute:afterInvoke', () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMonitorDefer(undefined);
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!monitorDefer) return null;

  return (
    <DeferTaskMonitor
      key={monitorDefer.name}
      className={className}
      defer={monitorDefer}
      style={{ width: 300, ...style }}
    />
  );
};
