import React, { useEffect } from 'react';
import { BizMenu, IBizMenuItem } from '../BizMenu';

export interface IFloatBizMenuProps {
  className?: string;
  style?: React.CSSProperties;

  items: IBizMenuItem[];
  onCheckEnabled?: (command: string, arg?: string) => boolean;
  onCommand?: (cmd: string, arg?: string) => any;

  cursor?: { x: number; y: number };

  visible?: boolean;
  onClose?: () => any;
}

export const FloatBizMenu = ({
  className,
  style,
  visible,
  onCommand,
  onCheckEnabled,
  items,
  cursor = { x: 0, y: 0 },
  onClose,
}: IFloatBizMenuProps) => {
  useEffect(() => {
    if (visible) {
      const _handleKeydown = (ev: KeyboardEvent): void => {
        if (ev.key.toLowerCase() === 'escape' && onClose) onClose();
      };
      document.addEventListener('keydown', _handleKeydown);
      return () => {
        document.removeEventListener('keydown', _handleKeydown);
      };
    }
  }, [visible]);
  if (!visible) return null;

  return (
    <div
      data-name='FloatBizMenu'
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 99999,
        cursor: 'default',
        ...style,
      }}
      onClick={onClose}
    >
      <BizMenu onCommand={onCommand} onCheckEnabled={onCheckEnabled} items={items} cursor={cursor} />
    </div>
  );
};
