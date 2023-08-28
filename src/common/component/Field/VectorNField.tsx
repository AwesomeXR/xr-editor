import { CloseCircleOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Popover, Row, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { InlineCell } from '../InlineCell';
import { NumberField } from './NumberField';
import { StringField } from './StringField';

export interface IVectorNFieldProps<T> {
  className?: string;
  style?: React.CSSProperties;

  scalarNames: string[];
  transformer: { to: (list: number[]) => T; from: (vec: T) => number[] };
  defaultValue?: T;
  value?: T;

  onChange?: (value: T | undefined) => any;

  allowClear?: boolean;
  actions?: any[];

  onLabelClick?: () => any;
  onNew?: (scalarNames: string[]) => number[];
}

export function VectorNField<T>({
  className,
  style,
  value,
  defaultValue,
  transformer,
  scalarNames,
  onChange,
  allowClear,
  actions,
  onNew,
}: IVectorNFieldProps<T>) {
  const [stash, setStash] = useState<number[] | undefined>(
    value || defaultValue ? transformer.from((value || defaultValue)!) : undefined
  );
  const [popoverOpen, setPopoverOpen] = useState<boolean>();

  useEffect(() => {
    setStash(value ? transformer.from(value) : undefined);
  }, [value]);

  const handleSet = (list: number[]) => {
    setStash(list);

    const vec = transformer.to(list);
    onChange?.(vec);
  };

  const handleSetAt = (i: number, value: number) => {
    if (!stash) return;

    const list = stash.concat();
    list[i] = value;

    handleSet(list);
  };

  const handleClear = () => {
    setStash(undefined);
    onChange?.(undefined);
  };

  const renderPopoverContent = () => {
    if (!stash) return null;

    return (
      <div style={{ width: 240 }}>
        {scalarNames.map((label, i) => (
          <InlineCell key={label} label={label}>
            <NumberField value={stash[i]} onChange={v => handleSetAt(i, v || 0)} />
          </InlineCell>
        ))}
        <InlineCell label='值'>
          <StringField value={stash.join(' | ')} onChange={v => handleSet(v.split(' | ').map(s => parseFloat(s)))} />
        </InlineCell>
      </div>
    );
  };

  return (
    <div data-name='VectorNField' className={className} style={style}>
      {stash ? (
        <Row gutter={4} align='middle'>
          <Popover trigger='click' open={popoverOpen} onOpenChange={setPopoverOpen} content={renderPopoverContent}>
            <Button type={'text'} size='small' style={{ flex: 1, textAlign: 'left', width: 1 }}>
              <Typography.Text ellipsis className='xr-text-code'>
                {stash.join(' | ')}
              </Typography.Text>
            </Button>
          </Popover>

          <Space size={0}>
            {actions}
            {allowClear && (
              <Popconfirm
                title='确定清除？'
                overlayInnerStyle={{ width: 200 }}
                onConfirm={handleClear}
                children={<Button size='small' icon={<CloseCircleOutlined />} type='text' danger title='清除' />}
              />
            )}
          </Space>
        </Row>
      ) : (
        <Button
          block
          size='small'
          type='dashed'
          title='点击设置'
          onClick={() => {
            const list = onNew ? onNew(scalarNames) : scalarNames.map(() => 0);
            handleSet(list);
          }}
        >
          未设置
        </Button>
      )}
    </div>
  );
}
