import React, { useContext, useState } from 'react';
import { CommandButton } from './CommandButton';
import { BizIcon } from '../../common/component/BizIcon';
import { XREditorContext } from '../XREditorContext';
import { Button, Checkbox, Col, Popover, Row, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { ISceneGizmoState } from '../ViewModel';

export interface IGizmoStateButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const GizmoStateButton = ({ className, style }: IGizmoStateButtonProps) => {
  const ctx = useContext(XREditorContext);
  const [popoverOpen, setPopoverOpen] = useState<boolean>();

  const scene = ctx.project.activeScene;
  if (!scene) return null;

  const renderPopoverContent = () => {
    const options: { label: string; value: keyof ISceneGizmoState }[] = [
      { label: '网格高亮', value: 'gizmoVisible_meshHighlight' },
      { label: '变换指示', value: 'gizmoVisible_transformGizmo' },
      { label: '灯光指示', value: 'gizmoVisible_lightIndicator' },
      { label: '灯光锥体', value: 'gizmoVisible_lightFrustum' },
      { label: '相机指示', value: 'gizmoVisible_cameraIndicator' },
      { label: '地面', value: 'gizmoVisible_ground' },
      { label: '游标', value: 'gizmoVisible_cursor' },
      { label: '关系线', value: 'gizmoVisible_relationLine' },
      { label: '实体体积', value: 'gizmoVisible_volume' },
      { label: '其他指示器', value: 'gizmoVisible_locationIndicator' },
    ];

    return (
      <div style={{ width: 300 }}>
        <Row>
          {options.map(item => (
            <Col span={12} key={item.value}>
              <Checkbox
                defaultChecked={scene.gizmoState[item.value]}
                onChange={e => {
                  ctx.project.command.execute(
                    'Scene_UpdateGizmoState',
                    { sceneID: scene.ID, state: { [item.value]: e.target.checked } },
                    { skipIfDisabled: true }
                  );
                }}
              >
                <span style={{ userSelect: 'none' }}>{item.label}</span>
              </Checkbox>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  return (
    <Space.Compact size='small'>
      <CommandButton
        className={className}
        style={style}
        type={scene.gizmoState.gizmoVisible ? 'primary' : 'default'}
        icon={<BizIcon name='overlay' />}
        command={'Scene_UpdateGizmoState'}
        arg={{ sceneID: scene.ID, state: { gizmoVisible: !scene.gizmoState.gizmoVisible } }}
      >
        叠加层
      </CommandButton>

      <Popover
        content={renderPopoverContent}
        placement='bottom'
        destroyTooltipOnHide
        trigger={['click']}
        onOpenChange={setPopoverOpen}
        transitionName=''
      >
        <Button type={popoverOpen ? 'primary' : 'default'} icon={<DownOutlined />} />
      </Popover>
    </Space.Compact>
  );
};
