import React, { useContext } from 'react';
import { BizMenuBar, IDatasourceItem } from '../../common';
import { XREditorContext } from '../XREditorContext';
import { Deferred } from 'xr-core';

export interface IBizXRMenuBarProps {
  className?: string;
  style?: React.CSSProperties;

  datasource: IDatasourceItem[];

  external?: Record<
    string,
    {
      isEnabled?: (arg?: any) => boolean;
      execute: (arg?: any) => Deferred<void> | void;
    }
  >;
}

export const BizXRMenuBar = ({ className, style, datasource, external = {} }: IBizXRMenuBarProps) => {
  const ctx = useContext(XREditorContext);

  const handleCheckEnabled = (cmd: string, arg?: string) => {
    if (external[cmd]) {
      if (external[cmd].isEnabled) return external[cmd]!.isEnabled!(arg);
      return true;
    }

    return ctx.command.isEnabled(cmd as any, arg);
  };

  const handleCommand = (cmd: string, arg?: string) => {
    if (external[cmd]) return external[cmd].execute!(arg);
    return ctx.command.execute(cmd as any, arg);
  };

  return (
    <BizMenuBar
      className={className}
      style={style}
      datasource={datasource}
      onCheckEnabled={handleCheckEnabled}
      onCommand={handleCommand}
    />
  );
};
