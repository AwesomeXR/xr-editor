import { ExpandOutlined } from '@ant-design/icons';
import {
  isSchemaArray,
  isSchemaBoolean,
  isSchemaInteger,
  isSchemaNumber,
  isSchemaObject,
  isSchemaString,
  Schema,
} from 'ah-api-type';
import { Button, Drawer, Form, Radio, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { SchemaFormItems } from '../SchemaFormItems';
import { BooleanField } from './BooleanField';
import { NumberField } from './NumberField';
import { SelectField } from './SelectField';
import { SliderField } from './SliderField';
import { StringField } from './StringField';

export interface IJSONSchemaFieldProps {
  className?: string;
  style?: React.CSSProperties;

  defaultValue?: any;
  value?: any;

  schema: Schema;

  onChange?(value: any): any;
}

export const JSONSchemaField = ({
  className,
  style,
  defaultValue,
  value,
  schema,
  onChange = () => {},
}: IJSONSchemaFieldProps) => {
  const [visible, setVisible] = useState(false);
  let [stash, setStash] = useState<any>(value || defaultValue);

  stash = NumberField._trim(stash);

  useEffect(() => {
    if (value !== stash) setStash(value);
  }, [value]);

  const setStashAndOnChange = (_v: any) => {
    setStash(_v);
    onChange?.(_v);
  };

  // object/array 类型用表单
  if (isSchemaObject(schema) || isSchemaArray(schema)) {
    return (
      <>
        <div className={className} style={{ ...style }}>
          {value && (
            <Typography.Paragraph ellipsis copyable style={{ margin: 0 }}>
              {JSON.stringify(value)}
            </Typography.Paragraph>
          )}
          <Button size='small' block icon={<ExpandOutlined />} onClick={() => setVisible(true)}>
            展开编辑
          </Button>
        </div>

        <Drawer
          destroyOnClose
          width={600}
          title='数据编辑'
          open={visible}
          onClose={() => {
            setVisible(false);
            onChange?.(stash);
          }}
        >
          <Form
            size='small'
            initialValues={isSchemaArray(schema) ? { __list: stash } : stash} // SchemaFormItems 处理顶层 array 有问题
            onValuesChange={(_changedValue, newValue) => {
              if (isSchemaArray(schema)) setStash(newValue.__list);
              else setStash(newValue);
            }}
          >
            <SchemaFormItems
              rootSchema={isSchemaArray(schema) ? { type: 'object', properties: { __list: schema } } : schema}
            />
          </Form>
        </Drawer>
      </>
    );
  }

  // number or string enum
  if ((isSchemaNumber(schema) || isSchemaInteger(schema) || isSchemaString(schema)) && schema.enum) {
    const _setStringOrNumberStash = (v: any) => {
      if (isSchemaNumber(schema) || isSchemaInteger(schema)) setStashAndOnChange(+v);
      else setStashAndOnChange(v + '');
    };

    if (schema.enum.length <= 4) {
      return (
        <Radio.Group value={stash + ''} onChange={ev => _setStringOrNumberStash(ev.target.value)}>
          {schema.enum.map((v: any) => (
            <Radio key={v} value={v + ''} children={v} />
          ))}
        </Radio.Group>
      );
    }

    return (
      <SelectField
        value={stash + ''}
        onChange={v => _setStringOrNumberStash(v)}
        options={schema.enum.map(d => ({ label: d + '', value: d + '' }))}
      />
    );
  }

  // number
  if (isSchemaNumber(schema) || isSchemaInteger(schema)) {
    if (typeof schema.min === 'number' && typeof schema.max === 'number') {
      return (
        <SliderField
          value={stash}
          onChange={setStashAndOnChange}
          min={schema.min}
          max={schema.max}
          step={typeof schema.step === 'number' ? schema.step : (schema.max - schema.min) / 50}
        />
      );
    }
    return <NumberField value={stash} onChange={setStashAndOnChange} min={schema.min} max={schema.max} />;
  }

  // string
  if (isSchemaString(schema)) {
    return <StringField value={stash} onChange={setStashAndOnChange} />;
  }

  // boolean
  if (isSchemaBoolean(schema)) {
    return <BooleanField value={stash} onChange={setStashAndOnChange} />;
  }

  return <Typography.Text type='secondary'>暂无控件</Typography.Text>;
};
