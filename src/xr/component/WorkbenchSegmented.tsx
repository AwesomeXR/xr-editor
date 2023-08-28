import { FunctionOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import React, { useContext, useState } from 'react';
import { XREditorContext } from '../XREditorContext';
import { useListen } from '../../common/hook/useListen';
import { FloatBizMenu, IWBConfigData, useForceUpdate } from '../../common';
import { IBuiltinWBKeyItem } from '../ViewModel';
import { buildCommand } from '../BuildCommand';
import { BizIcon } from '../../common/component/BizIcon';

export interface IWorkbenchSegmentedProps {
  className?: string;
  style?: React.CSSProperties;
}

export const WorkbenchSegmented = ({ className, style }: IWorkbenchSegmentedProps) => {
  const ctx = useContext(XREditorContext);
  const fu = useForceUpdate();

  const [menuOpen, setMenuOpen] = useState<{ cursor: { x: number; y: number }; wbIdx: number }>();

  useListen(ctx.project.workbench.event, 'wbConfigChange', fu.update);
  useListen(ctx.project.workbench.event, 'wbConfigMetaChange', fu.update);

  const renderOption = (item: IWBConfigData, i: number) => {
    const _isAllowed = ctx.feature.allowedWorkbench?.includes(item.key as IBuiltinWBKeyItem);
    if (!_isAllowed) return null;

    const handleClick = () => ctx.project.command.execute('WB_Switch', { index: i }, { skipIfDisabled: true });

    const isActive = ctx.project.workbench.wbConfigIdx === i;

    const itemKey = item.key as IBuiltinWBKeyItem;
    let icon: any;

    if (itemKey === 'ModelDesign') icon = <BizIcon name='file_3D' />;
    else if (itemKey === 'AnimationDesign') icon = <BizIcon name='anim_data' />;
    else if (itemKey === 'LogicDesign') icon = <FunctionOutlined />;
    else if (itemKey === 'Export') icon = <SendOutlined />;

    return (
      <Button
        key={i}
        type={isActive ? 'primary' : 'default'}
        icon={icon}
        // onContextMenu={ev => {
        //   ev.stopPropagation();
        //   ev.preventDefault();
        //   setMenuOpen({ cursor: { x: ev.clientX, y: ev.clientY }, wbIdx: i });
        // }}
        onClick={handleClick}
      >
        {item.title || `工作区 ${i}`}
      </Button>
    );
  };

  return (
    <>
      <div data-name='WorkbenchSegmented' className={className} style={{ display: 'flex', ...style }}>
        <Space.Compact size='small'>{ctx.project.workbench.wbConfigList.map(renderOption)}</Space.Compact>

        {/* <CommandButton
          style={{ marginLeft: 4 }}
          size='small'
          type='text'
          icon={<PlusOutlined />}
          title='添加工作区'
          command={'WB_Add'}
          arg={{}}
        /> */}
      </div>

      {menuOpen && (
        <FloatBizMenu
          visible
          cursor={menuOpen.cursor}
          items={[
            {
              icon: 'greasepencil',
              title: '重命名',
              command: '__rename',
              arg: JSON.stringify({ index: menuOpen.wbIdx }),
            },
            { icon: 'panel_close', title: '删除', ...buildCommand('WB_Remove', { index: menuOpen.wbIdx }) },
          ]}
          onClose={() => setMenuOpen(undefined)}
          onCheckEnabled={(cmd, arg) => {
            if (cmd === '__rename') return true;
            return ctx.project.command.isEnabled(cmd as any, arg);
          }}
          onCommand={(cmd, arg) => {
            if (cmd === '__rename') {
              const { index } = JSON.parse(arg!);
              const wbConfig = ctx.project.workbench.wbConfigList[index];
              ctx
                .prompt<{ title?: string }>(
                  '重命名',
                  {
                    type: 'object',
                    properties: {
                      title: { type: 'string', title: '名称' },
                    },
                  },
                  { title: wbConfig.title || `工作区 ${index}` }
                )
                .then(ans => {
                  if (!ans) return;
                  ctx.command.execute('WB_Update', { index, title: ans.title });
                });
              return;
            }

            return ctx.project.command.execute(cmd as any, arg);
          }}
        />
      )}
    </>
  );
};
