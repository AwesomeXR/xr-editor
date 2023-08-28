import { CopyOutlined } from '@ant-design/icons';
import { FlowNodeSerializer, IDefaultFlowNode, IFlowNode } from 'ah-flow-node';
import { Collapse, Typography, Button, message, Popover, Select, SelectProps } from 'antd';
import copyToClipboard from 'copy-to-clipboard';
import React, { useContext, useState } from 'react';
import { InlineCell } from '../../common/component/InlineCell';
import { useForceUpdate } from '../../common/hook/useForceUpdate';
import { XREditorContext } from '../XREditorContext';
import { BizField } from './BizField';
import { FlowNodePropRender } from './FlowNodePropRender';
import { isEdittimeNode } from '../IFlowNodeEdittimeData';
import { CommandSystem } from '../ViewModel/CommandSystem';
import { useListen } from '../../common';
import _ from 'lodash';

export interface IFlowNodePanelProps {
  className?: string;
  style?: React.CSSProperties;

  flowNode: IDefaultFlowNode;
}

export const FlowNodePanel = ({ className, style, flowNode }: IFlowNodePanelProps) => {
  const ctx = useContext(XREditorContext);
  const fu = useForceUpdate();

  useListen(ctx.project.event, 'scene:host:node:props:change', fu.update);

  return (
    <div data-name='FlowNodePanel' className={className} style={style}>
      <Collapse destroyInactivePanel defaultActiveKey={['basic', 'config']}>
        <Collapse.Panel key='basic' header='基础信息'>
          <InlineCell label='模块'>
            <Typography.Text>{flowNode._define.cnName || flowNode._define.className}</Typography.Text>
          </InlineCell>
          <InlineCell label='名称'>
            <BizField.StringField
              value={flowNode.name}
              onChange={v => {
                const cmd = CommandSystem.build('Scene_UpdateFlowNode', {
                  IDs: [flowNode.ID],
                  propPath: 'name',
                  value: v,
                });
                ctx.command.execute(cmd.command, cmd.arg);
              }}
            />
          </InlineCell>

          {/* <InlineCell label='端口' help='启用额外端口'>
            <CustomFlowNodeIO flowNode={flowNode} />
          </InlineCell> */}

          <InlineCell label='启用'>
            <BizField.BooleanField
              value={flowNode.enabled}
              onChange={v => {
                const cmd = CommandSystem.build('Scene_UpdateFlowNode', {
                  IDs: [flowNode.ID],
                  propPath: 'enabled',
                  value: v,
                });
                ctx.command.execute(cmd.command, cmd.arg);
              }}
            />
          </InlineCell>
        </Collapse.Panel>

        <Collapse.Panel key='config' header='配置'>
          <FlowNodePropRender target={flowNode} />
        </Collapse.Panel>

        <Collapse.Panel key='developer' header='开发者'>
          <InlineCell label='ID'>
            <Typography.Text copyable>{flowNode.ID}</Typography.Text>
          </InlineCell>
          <InlineCell label='Hierarchy ID'>
            <Typography.Text copyable>{flowNode.ID}</Typography.Text>
          </InlineCell>

          <Button
            block
            size='small'
            onClick={() => {
              const desc = FlowNodeSerializer.save(flowNode);
              copyToClipboard(JSON.stringify(desc, null, 2), { format: 'text/plain' });
              message.success(`已复制 ${flowNode.name}`);
            }}
            style={{ marginTop: 8 }}
          >
            复制模块代码
          </Button>
        </Collapse.Panel>
      </Collapse>
    </div>
  );
};

const CustomFlowNodeIO = (p: { flowNode: IDefaultFlowNode }) => {
  const ctx = useContext(XREditorContext);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const { flowNode } = p;

  if (!isEdittimeNode(p.flowNode)) return null;

  const extraInputKeys = flowNode.input.__edittimeData?.flowExtraInputs || [];
  const extraOutputKeys = flowNode.input.__edittimeData?.flowExtraOutputs || [];

  const inputOptions = Object.entries(flowNode._define.input)
    .filter(d => d[1].hiddenInGraph)
    .map(d => ({ label: d[1].title || d[0], value: d[0] }));

  const outputOptions = Object.entries(flowNode._define.output)
    .filter(d => d[1].hiddenInGraph)
    .map(d => ({ label: d[1].title || d[0], value: d[0] }));

  const renderPopoverContent = () => {
    const _cProps: SelectProps = {
      allowClear: true,
      size: 'small',
      mode: 'multiple',
      style: { width: 1, flex: 1 },
      filterOption: (input, option) => (option as any).label.toLowerCase().indexOf(input.toLowerCase()) >= 0,
    };

    return (
      <div style={{ width: 400 }}>
        <InlineCell label='输入' childrenStyle={{ display: 'flex', alignItems: 'center' }}>
          <Select
            {..._cProps}
            placeholder='输入端口'
            defaultValue={extraInputKeys}
            onChange={keys => {
              flowNode.input.__edittimeData = { ...flowNode.input.__edittimeData, flowExtraInputs: keys };
            }}
            options={inputOptions}
          />
          <Button
            icon={<CopyOutlined />}
            size='small'
            type='link'
            onClick={() => copyToClipboard((flowNode.input.__edittimeData?.flowExtraInputs || []).join('\n'))}
          />
        </InlineCell>
        <InlineCell label='输出' childrenStyle={{ display: 'flex', alignItems: 'center' }}>
          <Select
            {..._cProps}
            placeholder='输出端口'
            defaultValue={extraOutputKeys}
            onChange={keys => {
              flowNode.input.__edittimeData = { ...flowNode.input.__edittimeData, flowExtraOutputs: keys };
              // ctx.evBus.notifyObservers({ type: 'FlowNodeRefreshRequest', IDs: [flowNode.ID] });
            }}
            options={outputOptions}
          />
          <Button
            icon={<CopyOutlined />}
            size='small'
            type='link'
            onClick={() => copyToClipboard((flowNode.input.__edittimeData?.flowExtraOutputs || []).join('\n'))}
          />
        </InlineCell>
      </div>
    );
  };

  const displayText = `${extraInputKeys.length}/${inputOptions.length} -- ${extraOutputKeys.length}/${outputOptions.length}`;

  return (
    <Popover
      trigger={'click'}
      title='端口配置'
      destroyTooltipOnHide
      content={renderPopoverContent}
      open={modalOpen}
      onOpenChange={setModalOpen}
    >
      <Button size='small' block type={modalOpen ? 'primary' : 'default'}>
        {displayText}
      </Button>
    </Popover>
  );
};
