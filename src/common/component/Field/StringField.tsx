import { EditOutlined } from '@ant-design/icons';
import { Col, Input, InputNumber, Row, Slider, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

export interface IStringFieldProps {
  className?: string;
  style?: React.CSSProperties;

  defaultValue?: string;
  value?: string;

  defaultEditing?: boolean;

  onChange?(value: string): any;
}

export const StringField = ({
  className,
  style,
  defaultValue,
  value,
  defaultEditing = false,
  onChange,
}: IStringFieldProps) => {
  const [stash, setStash] = useState(value || defaultValue || '');
  const [editing, setEditing] = useState(defaultEditing);

  useEffect(() => {
    if (!editing && typeof value === 'string' && value !== stash) setStash(value);
  }, [value]);

  const handleConfirm = () => {
    setEditing(false);

    if (stash !== value) onChange?.(stash);
  };

  return (
    <div className={className} style={style}>
      {editing ? (
        <Input
          autoFocus
          size='small'
          value={stash}
          onChange={ev => setStash(ev.target.value)}
          onKeyPress={ev => {
            if (ev.code.toLowerCase() === 'enter') handleConfirm();
          }}
          onBlur={() => handleConfirm()}
          style={{ display: 'block' }}
        />
      ) : (
        <Typography.Text
          title={stash}
          type={stash ? undefined : 'secondary'}
          ellipsis
          copyable
          editable={{ editing: false, onStart: () => setEditing(true) }}
          style={{ display: 'block' }}
        >
          {stash || '未设置'}
        </Typography.Text>
      )}
    </div>
  );
};
