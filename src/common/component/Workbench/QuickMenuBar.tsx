import React from 'react';

export interface IQuickMenuBarProps {
  className?: string;
  style?: React.CSSProperties;

  left?: any;
  leftStyle?: React.CSSProperties;

  center?: any;
  centerStyle?: React.CSSProperties;

  right?: any;
  rightStyle?: React.CSSProperties;
}

export const QuickMenuBar = ({
  className,
  style,
  left,
  center,
  right,
  leftStyle,
  centerStyle,
  rightStyle,
}: IQuickMenuBarProps) => {
  return (
    <div
      data-name='QuickMenuBar'
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
        width: '100%',
        ...style,
      }}
    >
      <div data-name='left' style={{ width: 1, flex: 1, ...leftStyle }}>
        {left}
      </div>

      {center && (
        <div
          data-name='center'
          style={{ width: 1, flex: 1, display: 'flex', justifyContent: 'center', ...centerStyle }}
        >
          {center}
        </div>
      )}

      <div data-name='right' style={{ width: 1, flex: 1, display: 'flex', justifyContent: 'flex-end', ...rightStyle }}>
        {right}
      </div>
    </div>
  );
};
