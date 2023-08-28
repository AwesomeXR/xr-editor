import React from 'react';
import { FlowEditorModel } from './FlowEditorModel';
import { InlineCell, useForceUpdate, useListen } from '../../../common';
import { BizField } from '../../component/BizField';
import { Typography } from 'antd';
import { FlowDTRegistry } from 'ah-flow-node';

export interface IPropertyPanelProps {
  className?: string;
  style?: React.CSSProperties;

  model: FlowEditorModel;
}

export const PropertyPanel = ({ className, style, model }: IPropertyPanelProps) => {
  const fu = useForceUpdate();

  useListen(model.event, 'afterStateChange', fu.update);
  useListen(model.event, 'afterFlowNodeSelectChange', fu.update);

  const node = model.activeNode;
  if (!node) {
    return (
      <Typography.Text type='secondary' className={className} style={style}>
        未选中节点
      </Typography.Text>
    );
  }

  const renderInputs = () => {
    const eleList: React.ReactNode[] = [];

    for (const ioKey in node._define.input) {
      const ioDef = node._define.input[ioKey];
      const dt = FlowDTRegistry.Default.get(ioDef.dataType);
      if (!dt || !dt.View) continue;

      eleList.push(
        <InlineCell key={ioKey} label={ioDef.title || ioKey}>
          <dt.View ioDef={ioDef} ioKey={ioKey} node={node} />
        </InlineCell>
      );
    }

    return eleList;
  };

  return (
    <div data-name='PropertyPanel' className={className} style={style}>
      <InlineCell label='ID'>
        <Typography.Text>{node.ID}</Typography.Text>
      </InlineCell>
      <InlineCell label='节点'>
        <BizField.StringField value={node.name} />
      </InlineCell>

      {renderInputs()}
    </div>
  );
};
