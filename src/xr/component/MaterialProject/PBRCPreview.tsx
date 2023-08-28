import React, { useContext, useEffect, useRef, useState } from 'react';
import { XREditorContext } from '../../XREditorContext';
import { PBRComposerModel } from '../../ViewModel/PBRComposerModel';
import { Segmented, useHandler, useListen } from '../../../common';
import { BizCanvas } from '../../../common/lib/BizCanvas';

export interface IPBRCPreviewProps {
  className?: string;
  style?: React.CSSProperties;

  composer: PBRComposerModel;
  previewSlotNames: string[];
}

export const PBRCPreview = ({ className, style, composer, previewSlotNames }: IPBRCPreviewProps) => {
  const ctx = useContext(XREditorContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewChannel, setPreviewChannel] = useState<'baseColor' | 'metallic' | 'roughness'>('baseColor');

  const handleRefreshResultCanvas = useHandler(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const cavCtx = canvas.getContext('2d')!;

    cavCtx.clearRect(0, 0, canvas.width, canvas.height);

    if (composer.latestResult) {
      const source = composer.latestResult[previewChannel].canvas;
      const arg = BizCanvas.calcDrawArgs(source, canvas, 'fill');
      cavCtx.drawImage(source, arg.sx, arg.sy, arg.sw, arg.sh, arg.dx, arg.dy, arg.dw, arg.dh);
    }
  });

  useListen(composer.event, 'afterCompose', handleRefreshResultCanvas);

  useEffect(() => handleRefreshResultCanvas(), [previewChannel, composer, previewSlotNames.join('.')]);

  return (
    <div data-name='PBRCPreview' className={className} style={style}>
      <Segmented
        size='small'
        value={previewChannel}
        options={['baseColor', 'metallic', 'roughness']}
        onChange={setPreviewChannel as any}
      />
      <canvas ref={canvasRef} height={1024} width={1024} style={{ display: 'block', width: '100%' }} />
    </div>
  );
};
