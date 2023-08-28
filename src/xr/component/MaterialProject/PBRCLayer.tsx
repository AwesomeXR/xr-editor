import React, { useState } from 'react';
import { Button, Segmented, Space } from 'antd';
import { useForceUpdate, useListen } from '../../../common';
import { PaintOpEditor } from './PaintOpEditor';
import { DeleteOutlined } from '@ant-design/icons';
import { IPBRComposerConfigLayer, PBRComposerModel, IPBRComposerChannel } from '../../ViewModel/PBRComposerModel';

export interface IPBRCLayerProps {
  className?: string;
  style?: React.CSSProperties;
  composer: PBRComposerModel;
  layer: IPBRComposerConfigLayer;
}

export const PBRCLayer = ({ className, style, composer, layer }: IPBRCLayerProps) => {
  const [activeCh, setActiveCh] = useState<IPBRComposerChannel>('baseColor');

  const fu = useForceUpdate();

  useListen(composer.event, 'afterConfigChange', fu.update);

  const renderContent = () => {
    const layerCh = layer.channelMap[activeCh];

    return (
      <div>
        {layerCh.ops.map((op, i) => (
          <div key={i} style={{ display: 'flex' }}>
            <PaintOpEditor
              value={op}
              onChange={newOp => {
                Object.assign(op, newOp);
                composer.triggerConfigChange();
              }}
              style={{ flex: 1, width: 1 }}
            />
            <Space.Compact size='small' style={{ marginLeft: 8 }}>
              <Button danger icon={<DeleteOutlined />} />
            </Space.Compact>
          </div>
        ))}
        <Button
          size='small'
          onClick={() => {
            layerCh.ops.push({ type: 'FillColor' });
            composer.triggerConfigChange();
          }}
        >
          添加绘制方法
        </Button>
      </div>
    );
  };

  return (
    <div data-name='PBRCLayer' className={className} style={{ minHeight: 100, ...style }}>
      <Segmented
        size='small'
        value={activeCh}
        options={['baseColor', 'metallic', 'roughness']}
        onChange={setActiveCh as any}
      />
      {renderContent()}
    </div>
  );
};
