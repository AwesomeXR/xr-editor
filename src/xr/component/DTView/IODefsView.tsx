import React, { useRef } from 'react';
import { IDTViewProps } from '../../IFlowNodeEdittimeData';
import { Button, Form, Input, Space, theme } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { SimpleSelect, getInternalRandomString } from '../../../common';
import { FlowDTRegistry, GetFlowDTType, IDefaultFlowNode, IFlowDTKey, IFlowNodeInput, Util } from 'ah-flow-node';
import { BizField } from '../BizField';
import _ from 'lodash';
import { DTView } from '.';

export interface IIODefsViewProps extends IDTViewProps {
  className?: string;
  style?: React.CSSProperties;
}

type IFromData = {
  list: (Partial<GetFlowDTType<'InputDefs'>[0]> | undefined)[];
};

function calcInitValue(node: IDefaultFlowNode, ioKey: string) {
  const data: IFromData = { list: [] };

  if (node._define.input[ioKey]?.dataType === 'InputDefs' && node.input[ioKey]) {
    for (const item of node.input[ioKey]) {
      data.list.push(item);
    }
  }

  return data;
}

export const IODefsView = ({ className, style, ioDef, ioKey, node }: IIODefsViewProps) => {
  const token = theme.useToken();

  const debounceSetNodeInput = useRef(
    _.debounce((ioKey: string, value: any) => node.setInput(ioKey, value), 200, { leading: true })
  );

  const handleFormChange = (value: IFromData) => {
    const defs: GetFlowDTType<'InputDefs'> = [];

    for (const item of value.list) {
      if (!item || !item.key || !item.def) continue;
      defs.push({ key: item.key, def: item.def });
    }

    debounceSetNodeInput.current(ioKey, defs);
  };

  const renderIOMeta = (formListIdx: number, item: IFromData['list'][0]) => {
    if (!item) return null;

    const eleList: any[] = [];

    // 默认值控件
    if (item.def && item.key) {
      let field: any;

      if (item.def.dataType === 'String') field = <BizField.StringField />;
      else if (item.def.dataType === 'Number') field = <BizField.NumberField />;
      else if (item.def.dataType === 'Vector3') field = <BizField.Vector3Field />;
      else if (item.def.dataType === 'Boolean') field = <BizField.BooleanField />;

      if (field) {
        eleList.push(
          <Form.Item key='defaultValue' label='默认值' name={[formListIdx, 'def', 'defaultValue']}>
            {field}
          </Form.Item>
        );
      }
    }

    if (item.def?.dataType === 'Vector3') {
      eleList.push(
        <Form.Item key='isPositionGizmoOrigin' label='移动工具' name={[formListIdx, 'def', 'isPositionGizmoOrigin']}>
          <BizField.BooleanField />
        </Form.Item>
      );
    }

    return eleList;
  };

  return (
    <div data-name='IODefMap' className={className} style={style}>
      <Form
        size='small'
        autoComplete='off'
        initialValues={{ list: node.input[ioKey] } as IFromData}
        onValuesChange={(_c, value) => handleFormChange(value)}
      >
        <Form.List name='list'>
          {(fields, { add, remove, move }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <section
                  key={key}
                  style={{
                    marginBottom: 6,
                    borderBottom: `1px solid ${token.token.colorBorderSecondary}`,
                  }}
                >
                  <div style={{ display: 'flex', marginBottom: 4, alignItems: 'center' }}>
                    <div>
                      <div data-name='key'>
                        <Form.Item {...restField} name={[name, 'key']}>
                          <Input placeholder='key' style={{ fontWeight: 'bolder' }} />
                        </Form.Item>
                      </div>

                      <div data-name='dataType_title' style={{ marginTop: 4, display: 'flex', alignItems: 'center' }}>
                        <Form.Item {...restField} name={[name, 'def', 'dataType']} style={{ flex: 1 }}>
                          <SimpleSelect
                            allowClear={false}
                            placeholder='dataType'
                            size='small'
                            options={FlowDTRegistry.Default.getAllType().map(d => ({
                              label: FlowDTRegistry.Default.get(d)!.title || d,
                              value: d,
                            }))}
                          />
                        </Form.Item>
                        <Form.Item {...restField} name={[name, 'def', 'title']} style={{ marginLeft: 4, flex: 1 }}>
                          <Input placeholder='title' />
                        </Form.Item>
                      </div>
                    </div>

                    <Space.Compact size='small' style={{ marginLeft: 4 }}>
                      <Button
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
                      />
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
                </section>
              ))}
              <Form.Item>
                <Button
                  type='dashed'
                  onClick={() =>
                    add({ key: getInternalRandomString(), def: { dataType: 'String' } } as IFromData['list'][0])
                  }
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
