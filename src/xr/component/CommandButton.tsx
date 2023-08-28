import { Button, ButtonProps } from 'antd';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { IXRCommand } from '../IXRCommand';
import { XREditorContext } from '../XREditorContext';

export type ICommandButtonProps<C extends keyof IXRCommand> = ButtonProps & {
  command: C;
  arg?: IXRCommand[C] | string;
};

export const CommandButton = <C extends keyof IXRCommand>({ command, arg, ...props }: ICommandButtonProps<C>) => {
  const ctx = useContext(XREditorContext);
  const [loading, setLoading] = useState<boolean>();

  const isDisposedRef = useRef(false);

  useEffect(() => {
    return () => {
      isDisposedRef.current = true;
    };
  }, []);

  const disableMsg = props.disabled ? '已被禁用' : ctx.command.messageIfDisabled(command, arg);
  const isEnabled = !disableMsg;

  return (
    <Button
      {...props}
      loading={loading}
      disabled={!isEnabled}
      title={disableMsg || props.title}
      onMouseDown={ev => {
        props.onMouseDown?.(ev);

        if (isEnabled) {
          const defer = ctx.command.execute(command, arg);

          const timer = setTimeout(() => {
            if (isDisposedRef.current) return;
            setLoading(true);
          }, 200);

          defer.ret.finally(() => {
            clearTimeout(timer);
            if (isDisposedRef.current) return;

            setLoading(false);
          });
        }
      }}
    ></Button>
  );
};
