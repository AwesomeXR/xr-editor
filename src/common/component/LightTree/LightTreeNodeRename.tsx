import React, { useEffect, useState } from 'react';

export interface ILightTreeNodeRenameProps {
  className?: string;
  style?: React.CSSProperties;

  initValue?: string;
  onSubmit?: (value: string) => any;
  onCancel?: () => any;
}

export const LightTreeNodeRename = ({ className, style, initValue, onSubmit, onCancel }: ILightTreeNodeRenameProps) => {
  const [stash, setStash] = useState<string>(initValue || '');

  useEffect(() => {
    const _handleKeydown = (ev: KeyboardEvent): void => {
      if (ev.key.toLowerCase() === 'escape' && onCancel) onCancel();
    };
    document.addEventListener('keydown', _handleKeydown);
    return () => {
      document.removeEventListener('keydown', _handleKeydown);
    };
  }, []);

  return (
    <input
      className={className}
      style={style}
      autoFocus
      type='text'
      value={stash}
      onChange={ev => setStash(ev.target.value)}
      onFocus={ev => ev.target.select()}
      onBlur={() => {
        if (initValue === stash) onCancel?.();
        else onSubmit?.(stash);
      }}
      onKeyDown={ev => {
        if (ev.key === 'Enter') {
          if (initValue === stash) onCancel?.();
          else onSubmit?.(stash);
        }
      }}
    />
  );
};
