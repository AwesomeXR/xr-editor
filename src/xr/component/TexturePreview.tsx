import { Radio } from 'antd';
import React, { createRef, useLayoutEffect, useState } from 'react';
import { BaseTexture } from 'xr-impl-bjs/dist/bjs';
import { TextureChannelsToDisplay, TextureHelper } from '../lib/TextureHelper';

export interface ITexturePreviewProps {
  texture: BaseTexture;

  className?: string;
  style?: React.CSSProperties;
  canvasStyle?: React.CSSProperties;
}

export const TexturePreview = ({ texture, className, style, canvasStyle }: ITexturePreviewProps) => {
  const ref = createRef<HTMLCanvasElement>();
  const [previewInfo, setPreviewInfo] = useState<{
    channel: keyof TextureChannelsToDisplay | 'ALL';
    face: number;
  }>({ channel: 'ALL', face: 0 });

  useLayoutEffect(() => {
    updatePreview();
  }, [texture.uniqueId, previewInfo.channel, previewInfo.face]);

  const updatePreview = async () => {
    if (ref.current) {
      const ctx = ref.current.getContext('2d')!;

      const data = await TextureHelper.GetTextureDataAsync(texture, 512, 512, previewInfo.face, {
        R: previewInfo.channel === 'R' || previewInfo.channel === 'ALL',
        G: previewInfo.channel === 'G' || previewInfo.channel === 'ALL',
        B: previewInfo.channel === 'B' || previewInfo.channel === 'ALL',
        A: previewInfo.channel === 'A' || previewInfo.channel === 'ALL',
      });

      const imgData = ctx.createImageData(512, 512);
      imgData.data.set(data);

      ctx.putImageData(imgData, 0, 0);
    }
  };

  const renderCubeControl = () => {
    return (
      <Radio.Group
        size='small'
        value={previewInfo.face}
        onChange={ev => {
          const i = ev.target.value as number;
          setPreviewInfo({ ...previewInfo, face: i });
        }}
        style={{ width: '100%', display: 'flex' }}
      >
        {[0, 1, 2, 3, 4, 5].map(i => (
          <Radio.Button key={i} value={i} style={{ flex: 1, textAlign: 'center' }}>
            {['X+', 'X-', 'Y+', 'Y-', 'Z+', 'Z-'][i]}
          </Radio.Button>
        ))}
      </Radio.Group>
    );
  };

  const render2DControl = () => {
    return (
      <Radio.Group
        size='small'
        value={previewInfo.channel}
        onChange={ev => {
          const c = ev.target.value as any;
          setPreviewInfo({ ...previewInfo, channel: c });
        }}
        style={{ width: '100%', display: 'flex' }}
      >
        {['R', 'G', 'B', 'A', 'ALL'].map(c => (
          <Radio.Button key={c} value={c} style={{ flex: 1, textAlign: 'center' }}>
            {c === 'ALL' ? 'RGBA' : c}
          </Radio.Button>
        ))}
      </Radio.Group>
    );
  };

  return (
    <div className={className} style={{ ...style }}>
      <div style={{ marginBottom: 8 }}>{texture.isCube ? renderCubeControl() : render2DControl()}</div>
      <canvas
        ref={ref}
        width={512}
        height={512}
        className='transparent-board'
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          border: '1px solid #ddd',
          ...canvasStyle,
        }}
      />
    </div>
  );
};
