import React, { useContext } from 'react';
import { UserLevelEnum } from '../IUserLevel';
import { XREditorContext } from '../XREditorContext';
import { useForceUpdate, useListen } from '../../common';

export interface IUserLevelRequirementProps {
  className?: string;
  style?: React.CSSProperties;

  level?: UserLevelEnum;
  children?: React.ReactNode;
}

export const UserLevelRequirement = ({
  className,
  style,
  children,
  level = UserLevelEnum.Anonymous,
}: IUserLevelRequirementProps) => {
  const ctx = useContext(XREditorContext);
  const fu = useForceUpdate();

  useListen(ctx.project.event, 'afterUserLevelChange', fu.update);

  const isAllowed = ctx.project.userLevel >= level;

  const renderOverlay = () => {
    if (isAllowed) return null;

    let text = '';

    if (level === UserLevelEnum.Anonymous) text = '游客';
    else if (level === UserLevelEnum.Normal) text = '登录';
    else if (level === UserLevelEnum.Vip) text = 'VIP';
    else text = level + '';

    return (
      <>
        <div
          style={{
            padding: 4,
            borderRadius: 99,
            position: 'absolute',
            right: 0,
            top: 0,
            background: 'red',
            color: '#fff',
            fontSize: 12,
            lineHeight: '12px',
            transform: 'translate(8px, -50%)',
            pointerEvents: 'none',
          }}
        >
          {text}
        </div>
        <a
          style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
          onClick={() => ctx.project.requestUserLevel(level)}
        />
      </>
    );
  };

  return (
    <div
      data-name='UserLevelRequirement'
      className={className}
      style={{ display: 'inline-block', position: 'relative', ...style }}
    >
      {children}
      {renderOverlay()}
    </div>
  );
};
