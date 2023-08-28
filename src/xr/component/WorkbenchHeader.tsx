import { Divider, Space, Typography } from 'antd';
import React, { useContext } from 'react';
import { useForceUpdate } from '../../common/hook/useForceUpdate';
import { useListen } from '../../common/hook/useListen';
import { XREditorContext } from '../XREditorContext';
import { CommandButton } from './CommandButton';
import { SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { WorkbenchTaskStatus } from './WorkbenchTaskStatus';
import { WorkbenchSegmented } from './WorkbenchSegmented';
import { HighlightPopover } from '../../common/component/HighlightPopover';
import { ProjectSetting } from './ProjectSetting';
import { SceneSwitchButton } from './SceneSwitchButton';

export interface IWorkbenchHeaderProps {
  className?: string;
  style?: React.CSSProperties;
}

export const WorkbenchHeader = ({ className, style }: IWorkbenchHeaderProps) => {
  const ctx = useContext(XREditorContext);
  const fu = useForceUpdate();

  useListen(ctx.project.event, 'beforeSave', fu.update);
  useListen(ctx.project.event, 'afterSave', fu.update);
  useListen(ctx.project.event, 'afterMetaInfoChange', fu.update);
  useListen(ctx.project.event, 'afterLint', fu.update);
  useListen(ctx.project.event, 'afterActiveSceneChange', fu.update);

  return (
    <div
      data-name='WorkbenchHeader'
      className={className}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...style }}
    >
      <Space>
        {ctx.slotRenderer?.headerLeading?.()}
        <Typography.Text strong style={{ fontSize: 16 }}>
          {ctx.project.projTitle}
        </Typography.Text>

        <HighlightPopover
          manualControl
          size='small'
          defaultBtnType='text'
          placement='bottomLeft'
          icon={<SettingOutlined />}
          content={() => <ProjectSetting style={{ width: 260 }} />}
        />

        <Divider type='vertical' />
        <SceneSwitchButton />

        <Divider type='vertical' />
        <WorkbenchSegmented />
      </Space>

      <Space size={16}>
        <WorkbenchTaskStatus />
        <CommandButton type='primary' size='small' icon={<SaveOutlined />} command={'Save'} arg={null}>
          保存
        </CommandButton>
      </Space>
    </div>
  );
};
