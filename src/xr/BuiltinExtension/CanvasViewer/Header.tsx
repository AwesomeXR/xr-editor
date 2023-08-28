import React, { useState } from 'react';
import { Button, Divider, Space, theme } from 'antd';
import { AimOutlined } from '@ant-design/icons';
import { FloatBizMenu, IBizMenuItem, useForceUpdate, useListen } from '../../../common';
import { CommandButton } from '../../component/CommandButton';
import { GizmoStateButton } from '../../component/GizmoStateButton';
import { CanvasViewerModel } from './CanvasViewerModel';
import { ViewportButton } from '../../component/ViewportButton';
import { BackgroundConfigButton } from '../../component/BackgroundConfigButton';

export interface IHeaderProps {
  className?: string;
  style?: React.CSSProperties;
  model: CanvasViewerModel;
}

export const Header = ({ className, style, model }: IHeaderProps) => {
  const { token } = theme.useToken();
  const fu = useForceUpdate();
  const [menuOpen, setMenuOpen] = useState<{ cursor: { x: number; y: number }; items: IBizMenuItem[] }>();

  useListen(model.project.event, 'scene:afterGizmoStateChange', fu.update);

  const scene = model.scene;
  if (!scene) return null;

  return (
    <>
      <div
        data-name='Header'
        className={className}
        style={{ display: 'flex', justifyContent: 'space-between', ...style }}
      >
        <Space>
          <ViewportButton />
          <BackgroundConfigButton />
        </Space>

        <Button size='small' icon={<AimOutlined />} onClick={() => scene.zoomOn('picked')}>
          放大
        </Button>

        <GizmoStateButton />
      </div>

      {menuOpen && (
        <FloatBizMenu
          visible
          items={menuOpen.items}
          cursor={menuOpen.cursor}
          onClose={() => setMenuOpen(undefined)}
          onCheckEnabled={model.project.command.isEnabled as any}
          onCommand={model.project.command.execute as any}
        />
      )}
    </>
  );
};
