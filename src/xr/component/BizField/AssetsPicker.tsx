import { Radio } from 'antd';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { Field } from '../../../common/component/Field';
import { FileExplorer } from './FileExplorer';

export interface IAssetsPickerProps {
  className?: string;
  style?: React.CSSProperties;

  defaultValue?: string;
  value?: string;
  acceptExts?: string[];

  onChange?: (path: string) => any;
}

export type IAssetsType = 'file' | 'http';
type IStashValue = { type: IAssetsType; file?: string; http?: string };

const getAssetsType = (path: string): IAssetsType => {
  if (path.startsWith('file://')) return 'file';
  return 'http';
};

const initStashValue = (value?: string): IStashValue => {
  if (value) {
    const type = getAssetsType(value);
    return { type, [type]: value };
  }
  return { type: 'file' };
};

export const AssetsPicker = ({ className, style, defaultValue, value, onChange, acceptExts }: IAssetsPickerProps) => {
  const [stashValue, setStashValue] = useState<IStashValue>(initStashValue(value || defaultValue));

  useEffect(() => {
    if (value) {
      const newStashValue = initStashValue(value);
      if (!_.isEqual(newStashValue, stashValue)) setStashValue(newStashValue);
    }
  }, [value]);

  const handleChange = (path: string) => {
    const type = getAssetsType(path);
    setStashValue({ ...stashValue, type, [type]: path });
    onChange?.(path);
  };

  return (
    <div className={className} style={{ ...style }}>
      <Radio.Group
        size='small'
        onChange={ev => setStashValue({ ...stashValue, type: ev.target.value })}
        value={stashValue.type}
      >
        <Radio value='file'>本地</Radio>
        <Radio value='http'>网络</Radio>
      </Radio.Group>
      <div>
        {stashValue.type === 'file' && (
          <FileExplorer value={stashValue.file} onChange={handleChange} acceptExts={acceptExts} />
        )}
        {stashValue.type === 'http' && <Field.StringField value={stashValue.http} onChange={handleChange} />}
      </div>
    </div>
  );
};
