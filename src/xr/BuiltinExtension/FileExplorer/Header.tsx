import { AppstoreOutlined, BarsOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Segmented, Space } from 'antd';
import React from 'react';
import { FileExplorerModel } from './FileExplorerModel';

export interface IHeaderProps {
  className?: string;
  style?: React.CSSProperties;

  model: FileExplorerModel;
}

export const Header = ({ className, style, model }: IHeaderProps) => {
  const scene = model.project.activeScene;
  if (!scene) return null;

  const host = scene.rootFlowHost;
  if (!host) return null;

  return (
    <div
      data-name='Header'
      className={className}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', ...style }}
    >
      {/* <Segmented
        size='small'
        value={model.state.displayType}
        options={[
          { value: 'List', icon: <BarsOutlined /> },
          { value: 'Grid', icon: <AppstoreOutlined /> },
        ]}
        onChange={v => model.changeDisplayType(v as any)}
      /> */}
      <Space size='small'>
        <Button size='small' icon={<PlusOutlined />} onClick={() => model.addDictionary()}>
          文件夹
        </Button>
      </Space>
    </div>
  );
};
