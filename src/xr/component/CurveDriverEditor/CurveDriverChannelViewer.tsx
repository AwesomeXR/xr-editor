import { IFlowNode } from 'ah-flow-node';
import React from 'react';

export interface ICurveDriverChannelViewerProps {
  className?: string;
  style?: React.CSSProperties;

  target: IFlowNode<'CurveDriverNode'>;
  channel: string;
}

export const CurveDriverChannelViewer = ({ className, style, target, channel }: ICurveDriverChannelViewerProps) => {
  return (
    <div data-name='CurveDriverChannelViewer' className={className} style={style}>
      {channel}
    </div>
  );
};
