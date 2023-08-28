import React, { useContext } from 'react';
import { BizMenuBar, useForceUpdate, useListen } from '../../common';
import { XREditorContext } from '../XREditorContext';
import { usePanelModel } from '../hook/usePanelModel';

export interface IBizXRPanelMenuBarProps {
  className?: string;
  style?: React.CSSProperties;
}

export const BizXRPanelMenuBar = ({ className, style }: IBizXRPanelMenuBarProps) => {
  const ctx = useContext(XREditorContext);
  const model = usePanelModel();

  const fu = useForceUpdate();
  useListen(model.event as any, 'afterMenuBarChange', fu.update);

  const handleCheckEnabled = (cmd: string, arg?: string) => {
    return ctx.command.isEnabled(cmd as any, arg);
  };

  const handleCommand = (cmd: string, arg?: string) => {
    return ctx.command.execute(cmd as any, arg);
  };

  return (
    <BizMenuBar
      className={className}
      style={style}
      datasource={model.menuBar}
      onCheckEnabled={handleCheckEnabled}
      onCommand={handleCommand}
    />
  );
};
