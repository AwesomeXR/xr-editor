import React from 'react';
import { IDTViewProps } from '../../IFlowNodeEdittimeData';
import { Button, Form, Input, Space } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { SimpleSelect, getInternalRandomString } from '../../../common';
import { FlowDTRegistry, IDefaultFlowNode, IFlowDTKey, IFlowNodeInput, Util } from 'ah-flow-node';
import { BizField } from '.';

export interface IIODefMapProps extends IDTViewProps {
  className?: string;
  style?: React.CSSProperties;
}

type IFromData = {
  list: (({ ioKey?: string } & Partial<IFlowNodeInput<IFlowDTKey>>) | undefined)[];
};

function calcInitValue(node: IDefaultFlowNode, ioKey: string) {
  const data: IFromData = { list: [] };
  for (const [key, ioDef] of Object.entries<any>(node.input[ioKey] || {})) {
    data.list.push({ ioKey: key, ...ioDef });
  }
  return data;
}

export const IODefMap = ({ className, style, ioDef, ioKey, node }: IIODefMapProps) => {
  const handleFormChange = (value: IFromData) => {
    const defMap = {} as any;

    for (const item of value.list) {
      if (!item || !item.dataType || !item.ioKey) continue;
      defMap[item.ioKey] = { ...item };
    }

    node.setInput(ioKey, defMap);
  };

  const renderIOMeta = (formListIdx: number, item: IFromData['list'][0]) => {
    if (!item) return null;

    if (item.dataType === 'Vector3') {
      return (
        <Form.Item label='移动工具' name={[formListIdx, 'isPositionGizmoOrigin']}>
          <BizField.BooleanField />
        </Form.Item>
      );
    }

    return null;
  };

  return (
    <div data-name='IODefMap' className={className} style={style}>
      <Form
        size='small'
        autoComplete='off'
        initialValues={calcInitValue(node, ioKey)}
        onValuesChange={(_c, value) => handleFormChange(value)}
      >
        <Form.List name='list'>
          {(fields, { add, remove, move }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <React.Fragment key={key}>
                  <div style={{ display: 'flex', marginBottom: 4, alignItems: 'center' }}>
                    <Form.Item {...restField} name={[name, 'ioKey']} noStyle hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'dataType']} style={{ marginLeft: 4, flex: 1 }}>
                      <SimpleSelect
                        allowClear={false}
                        size='small'
                        options={FlowDTRegistry.Default.getAllType().map(d => ({
                          label: FlowDTRegistry.Default.get(d)!.title || d,
                          value: d,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'title']} style={{ marginLeft: 4, flex: 1 }}>
                      <Input />
                    </Form.Item>

                    <Space.Compact size='small' style={{ marginLeft: 4 }}>
                      {/* <Button
                      type='text'
                      icon={<ArrowUpOutlined />}
                      onClick={() => move(name, name - 1)}
                      disabled={name <= 0}
                    />
                    <Button
                      type='text'
                      icon={<ArrowDownOutlined />}
                      onClick={() => move(name, name + 1)}
                      disabled={name >= fields.length - 1}
                    /> */}
                      <Button type='text' icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    </Space.Compact>
                  </div>

                  <div style={{ borderLeft: '3px solid #636363', paddingLeft: 4, margin: '4px' }}>
                    <Form.Item shouldUpdate noStyle>
                      {ins => {
                        const item = ins.getFieldValue(['list', name]);
                        return renderIOMeta(name, item);
                      }}
                    </Form.Item>
                  </div>
                </React.Fragment>
              ))}
              <Form.Item>
                <Button
                  type='dashed'
                  onClick={() => add({ ioKey: getInternalRandomString(), dataType: 'String' } as IFromData['list'][0])}
                  block
                  icon={<PlusOutlined />}
                >
                  添加端口
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </div>
  );
};
