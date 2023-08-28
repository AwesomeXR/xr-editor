import { Button, Popover } from 'antd';
import { BaseButtonProps } from 'antd/es/button/button';
import { TooltipPlacement } from 'antd/es/tooltip';
import React, { useEffect, useState } from 'react';

export type IHighlightPopoverContentRenderOpt = {
  close: () => any;
};

export interface IHighlightPopoverProps {
  className?: string;
  style?: React.CSSProperties;

  placement?: TooltipPlacement;
  content: (opt: IHighlightPopoverContentRenderOpt) => React.ReactNode;

  defaultBtnType?: 'link' | 'text' | 'default' | 'dashed' | 'primary';
  size?: 'large' | 'middle' | 'small';

  manualControl?: boolean; // 手动控制显示隐藏

  onOpen?: () => any;

  icon?: any;
  children?: any;
}

export const HighlightPopover = ({
  className,
  style,
  content,
  placement,
  icon,
  children,
  defaultBtnType,
  manualControl,
  size = 'small',
  onOpen,
}: IHighlightPopoverProps) => {
  const [open, setOpen] = useState<boolean>();

  useEffect(() => {
    if (open && onOpen) onOpen();
  }, [open]);

  return (
    <Popover
      destroyTooltipOnHide
      content={() => content({ close: () => setOpen(false) })}
      placement={placement}
      open={open}
      trigger={manualControl ? [] : ['click']}
      onOpenChange={open => setOpen(open)}
    >
      <Button
        className={className}
        style={style}
        size={size}
        icon={icon}
        type={open ? 'primary' : defaultBtnType}
        onClick={() => {
          if (manualControl) setOpen(!open);
        }}
      >
        {children}
      </Button>
    </Popover>
  );
};
