import React from 'react';
import { Button, Col, Typography, Form, Input, InputNumber, Radio, Row, Popconfirm, Space, Switch } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import _ from 'lodash';
import {
  isSchemaArray,
  isSchemaBoolean,
  isSchemaInteger,
  isSchemaNumber,
  isSchemaObject,
  isSchemaOneOf,
  isSchemaString,
  Schema,
  autoMock,
} from 'ah-api-type';
import { SimpleSelect } from '../SimpleSelect';

const { Text } = Typography;

export interface ISchemaFormProps {
  /** form 顶层 schema */
  rootSchema: Schema;

  /** 当前 schema */
  schema?: Schema;

  name?: (string | number)[];
  fieldKey?: (string | number)[];
  label?: string[];

  /** 是否 form list **顶层** */
  isListField?: boolean;

  /** 当前字段 required */
  required?: boolean;
  onStyle?: (fieldKey: (string | number)[]) => React.CSSProperties;
}

export const SchemaFormItems = ({
  rootSchema,
  schema = rootSchema,
  name = [],
  fieldKey = name,
  label = [],
  isListField = false,
  required,
  onStyle,
}: ISchemaFormProps): any => {
  const formIns = Form.useFormInstance();

  if (isSchemaObject(schema)) {
    return Object.entries(schema.properties || {}).map(([pKey, pSchema]) => {
      return (
        <SchemaFormItems
          onStyle={onStyle}
          key={pKey}
          rootSchema={rootSchema}
          schema={pSchema}
          name={[...name, pKey]}
          fieldKey={[...fieldKey, pKey]}
          label={[...label, pSchema.title || pKey]}
          isListField={isListField}
          required={schema.required?.includes(pKey)}
        />
      );
    });
  }

  // array，一般是从 object 递归下来的
  if (isSchemaArray(schema) && schema.items) {
    const listItemSchema = schema.items;

    return (
      <div style={{ paddingLeft: 12, borderLeft: '4px solid #ccc' }}>
        <div children={label} style={{ marginBottom: 8 }} />
        <Form.List name={name}>
          {(fields, listOp, { errors }) => {
            return (
              <>
                {fields.map((field, i) => {
                  return (
                    <section key={field.key} style={{ padding: 8, border: '1px solid #ddd', marginBottom: 8 }}>
                      <div children={`第 ${i + 1}/${fields.length} 项`} />
                      <Row style={{ marginTop: 4 }}>
                        <Col flex={1} style={{ width: 1 }}>
                          <SchemaFormItems
                            rootSchema={rootSchema}
                            schema={listItemSchema}
                            name={[i]}
                            fieldKey={[i]}
                            isListField={true}
                            onStyle={onStyle}
                          />
                        </Col>
                        <Col>
                          <Space size={0}>
                            <Button
                              icon={<ArrowUpOutlined />}
                              type='text'
                              disabled={i === 0}
                              title='上移'
                              onClick={() => listOp.move(i, i - 1)}
                            />
                            <Button
                              icon={<ArrowDownOutlined />}
                              type='text'
                              title='下移'
                              disabled={i === fields.length - 1}
                              onClick={() => listOp.move(i, i + 1)}
                            />
                            <Popconfirm
                              title='确定删除？'
                              onConfirm={() => listOp.remove(field.name)}
                              children={<Button icon={<DeleteOutlined />} type='text' danger title='删除' />}
                            />
                          </Space>
                        </Col>
                      </Row>
                    </section>
                  );
                })}
                <Form.Item>
                  <Button
                    type='dashed'
                    onClick={() => listOp.add(autoMock(listItemSchema))}
                    icon={<PlusOutlined />}
                    children={label.join('.')}
                  />
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            );
          }}
        </Form.List>
      </div>
    );
  }

  // oneOf 推导
  if (isSchemaOneOf(schema)) {
    return (
      <SchemaFormItems
        onStyle={onStyle}
        rootSchema={rootSchema}
        schema={schema.oneOf[0]}
        name={name}
        fieldKey={fieldKey}
        label={label}
        isListField={isListField}
        required={required}
      />
    );
  }

  // 以下是其他基本类型的 field

  let filed: any = <Input style={{ width: '100%' }} allowClear />;
  let filedValuePropName: string | undefined;

  // 判断基本类型
  if (isSchemaString(schema) || isSchemaInteger(schema) || isSchemaNumber(schema)) {
    if (schema.enum) {
      if (schema.enum.length >= 8) {
        // enum 过多，要使用 select
        filed = <SimpleSelect options={schema.enum.map(v => ({ label: v + '', value: v + '' }))} />;
      } else {
        filed = (
          <Radio.Group>
            {schema.enum.map((v: any) => (
              <Radio key={v} value={v} children={v} />
            ))}
            {
              // radio 字段非必填的话，提供 undefined 值
              !required && <Radio value={undefined} children={<Text type='secondary'>(不指定)</Text>} />
            }
          </Radio.Group>
        );
      }
    } else {
      if (isSchemaString(schema)) {
        filed = <Input style={{ width: '100%' }} allowClear />;
      }
      //
      else {
        filed = <InputNumber style={{ width: '100%' }} />;
      }
    }
  } else if (isSchemaBoolean(schema)) {
    filed = <Switch />;
    filedValuePropName = 'checked';
  }

  const renderItemExtra = () => {
    if (schema.description) return <Typography.Paragraph children={schema.description} />;
    return null;
  };

  return (
    <Form.Item
      style={onStyle?.(fieldKey)}
      label={label.join('.')}
      required={required}
      name={name}
      preserve={isListField ? undefined : false}
      fieldKey={fieldKey}
      isListField={isListField}
      rules={[{ required, message: `请填写 ${label.join('.')}` }]}
      extra={renderItemExtra()}
      valuePropName={filedValuePropName}
    >
      {filed}
    </Form.Item>
  );
};
