import { Popover, theme } from 'antd';
import React from 'react';

export interface IInlineCellProps {
  className?: string;
  style?: React.CSSProperties;
  labelAlign?: 'fixe-width' | 'grow';
  labelFixedSpan?: number;
  label: string;
  help?: any;
  children: any;
  childrenStyle?: React.CSSProperties;
}

export const InlineCell = ({
  className,
  style,
  labelAlign = 'fixe-width',
  labelFixedSpan = 6,
  label,
  help,
  children,
  childrenStyle,
}: IInlineCellProps) => {
  const finalLabelStyle: React.CSSProperties = {
    color: '#fff',
    fontSize: 14,
  };

  const finalChildrenStyle: React.CSSProperties = {
    marginLeft: 8,
    minHeight: 12,
    color: '#fff',
    fontSize: 14,
    ...childrenStyle,
  };

  if (labelAlign === 'fixe-width') {
    finalLabelStyle.width = (100 / 24) * labelFixedSpan + '%';
    finalChildrenStyle.width = (100 / 24) * (24 - labelFixedSpan) + '%';
  }
  //
  else if (labelAlign === 'grow') {
    finalLabelStyle.flex = 1;
    finalLabelStyle.width = 1;
  }

  const _ellipsisStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <section
      data-name={label}
      className={className}
      style={{ display: 'flex', alignItems: 'center', marginBottom: 4, ...style }}
    >
      <div style={finalLabelStyle}>
        {help ? (
          <Popover title={label} content={() => <div style={{ maxWidth: 400 }}>{help}</div>} arrow>
            <span style={{ ..._ellipsisStyle, userSelect: 'none', textDecoration: 'underline dashed' }}>{label}</span>
          </Popover>
        ) : (
          <span title={label} style={{ ..._ellipsisStyle, userSelect: 'none' }}>
            {label}
          </span>
        )}
      </div>

      <div style={finalChildrenStyle}>{children}</div>
    </section>
  );
};
