import React, { useEffect, useState } from 'react';
import './style.less';
import cx from 'classnames';

export interface ISplitViewProps {
  className?: string;
  style?: React.CSSProperties;

  left?: any;
  leftSize?: number;
  onLeftSizeChange?: (size: number) => void;

  right?: any;
  rightSize?: number;
  onRightSizeChange?: (size: number) => void;

  children: any;
}

export const SplitView = ({
  className,
  style,
  left,
  right,
  children,
  leftSize = 200,
  rightSize = 200,
  onLeftSizeChange,
  onRightSizeChange,
}: ISplitViewProps) => {
  const leftRef = React.useRef<HTMLDivElement>(null);
  const rightRef = React.useRef<HTMLDivElement>(null);

  const [_leftSize, setLeftSize] = useState<number>(leftSize);
  const [_rightSize, setRightSize] = useState<number>(rightSize);

  useEffect(() => setLeftSize(leftSize), [leftSize]);
  useEffect(() => setRightSize(rightSize), [rightSize]);

  const evaluatedLeftSize = left ? _leftSize : 0;
  const evaluatedRightSize = right ? _rightSize : 0;

  const handleMouseDown = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>, dragger: 'left' | 'right') => {
    ev.preventDefault();
    ev.stopPropagation();

    const startX = ev.clientX;
    const startLeftSize = evaluatedLeftSize;
    const startRightSize = evaluatedRightSize;

    // 开始拖拽
    const _handleMouseMove = (e: MouseEvent) => {
      const offset = e.clientX - startX;

      if (dragger === 'left' && leftRef.current) {
        const leftWidth = startLeftSize + offset;
        leftRef.current.style.width = `${leftWidth}px`;
      }

      if (dragger === 'right' && rightRef.current) {
        const rightWidth = startRightSize - offset;
        rightRef.current.style.width = `${rightWidth}px`;
      }
    };

    // 结束拖拽
    const _handleMouseUp = (e: MouseEvent) => {
      document.removeEventListener('mousemove', _handleMouseMove);
      document.removeEventListener('mouseup', _handleMouseUp);

      const offset = e.clientX - startX;

      if (dragger === 'left') {
        setLeftSize(startLeftSize + offset);
        onLeftSizeChange?.(startLeftSize + offset);
      }
      if (dragger === 'right') {
        setRightSize(startRightSize - offset);
        onRightSizeChange?.(startRightSize - offset);
      }
    };

    document.addEventListener('mousemove', _handleMouseMove);
    document.addEventListener('mouseup', _handleMouseUp);
  };

  return (
    <div data-name='SplitView' className={cx(className, 'SplitView')} style={style}>
      <div className='SplitView-children'>{children}</div>

      {left && (
        <div ref={leftRef} className='SplitView-left' style={{ width: evaluatedRightSize }}>
          <div className='content'>{left}</div>
          <div className='dragger' onMouseDown={ev => handleMouseDown(ev, 'left')} />
        </div>
      )}
      {right && (
        <div ref={rightRef} className='SplitView-right' style={{ width: evaluatedRightSize }}>
          <div className='content'>{right}</div>
          <div className='dragger' onMouseDown={ev => handleMouseDown(ev, 'right')} />
        </div>
      )}
    </div>
  );
};
