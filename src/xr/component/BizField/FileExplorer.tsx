import { Dropdown, Typography } from 'antd';
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import React, { useContext, useEffect, useState } from 'react';
import { XREditorContext } from '../../XREditorContext';
import { SimpleSelect } from '../../../common';
import _ from 'lodash';

export interface IFileExplorerProps {
  className?: string;
  style?: React.CSSProperties;

  defaultValue?: string;
  value?: string;

  acceptExts?: string[];

  onChange?: (filepath: string) => any;
}

export const FileExplorer = ({ className, style, defaultValue, value, onChange, acceptExts }: IFileExplorerProps) => {
  const ctx = useContext(XREditorContext);
  const [filepath, setFilepath] = useState(value || defaultValue);

  useEffect(() => {
    setFilepath(value);
  }, [value]);

  const handleGetOptions = async () => {
    let paths = await ctx.project.mfs.glob('**/*');

    if (acceptExts) paths = paths.filter(p => acceptExts.some(ext => p.endsWith(ext)));
    paths = _.sortBy(paths);

    return paths.map(p => ({ label: p, value: 'file://' + p }));
  };

  const handleChange = (path: string) => {
    setFilepath(path);
    onChange?.(path);
  };

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', ...style }}>
      <span>file://</span>
      <SimpleSelect
        size='small'
        getOptions={handleGetOptions}
        value={filepath}
        onChange={handleChange}
        style={{ marginLeft: 4, flex: 1 }}
      />
    </div>
  );
};
