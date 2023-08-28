import React from 'react';

export interface ISubCanvasViewerProps {
  className?: string;
  style?: React.CSSProperties;
}

export const SubCanvasViewer = ({ className, style }: ISubCanvasViewerProps) => {
  return (
    <div data-name='SubCanvasViewer' className={className} style={style}>
      SubCanvasViewer
    </div>
  );
};
