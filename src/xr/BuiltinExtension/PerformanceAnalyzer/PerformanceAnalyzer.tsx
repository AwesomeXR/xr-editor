import React, { useContext } from 'react';
import { Collapse, Descriptions, useFWPanelSize, useForceUpdate, useListen } from '../../../common';
import { XREditorContext } from '../../XREditorContext';
import { formatSize } from '../../../common/lib/formatSize';

export interface IPerformanceAnalyzerProps {
  className?: string;
  style?: React.CSSProperties;
}

const Desc = Descriptions;

export const PerformanceAnalyzer = ({ className, style }: IPerformanceAnalyzerProps) => {
  const ctx = useContext(XREditorContext);
  const fu = useForceUpdate();
  const size = useFWPanelSize();

  useListen(ctx.project.event, 'performance:afterPerfDataChange', fu.update);

  const perfData = ctx.project.performance.perfData;

  const renderItem = (label: string, data: string) => {
    return (
      <Desc.Item label={label}>
        <code>{data}</code>
      </Desc.Item>
    );
  };

  return (
    <div data-name='PerformanceAnalyzer' className={className} style={{ ...style }}>
      <Collapse
        destroyInactivePanel
        defaultActiveKey={['project', 'scene']}
        items={[
          {
            key: 'scene',
            label: '场景',
            children: (
              <Desc column={Math.floor(size.width / 250)}>
                {renderItem('FPS', (perfData?.fps || 0).toFixed(0))}
                {renderItem('活动对象', formatSize(perfData?.activeMeshes || 0))}
                {renderItem('活动顶点', formatSize(perfData?.activeIndices || 0))}
                {renderItem('活动骨骼', formatSize(perfData?.activeBones || 0))}
                {renderItem('活动粒子系统', formatSize(perfData?.activeParticles || 0))}
                {renderItem('DrawCalls', formatSize(perfData?.drawCalls || 0) + ' /帧')}
                {renderItem(
                  '活动对象检索',
                  (perfData?.activeMeshesEvaluationTime.lastSecAverage || 0).toFixed(2) + ' ms'
                )}
                {renderItem('渲染对象', (perfData?.renderTargetsRenderTime.lastSecAverage || 0).toFixed(2) + ' ms')}
                {renderItem('frame', (perfData?.frameTime.lastSecAverage || 0).toFixed(2) + ' ms')}
                {renderItem('render', (perfData?.renderTime.lastSecAverage || 0).toFixed(2) + ' ms')}
                {renderItem('interFrame', (perfData?.interFrameTime.lastSecAverage || 0).toFixed(2) + ' ms')}
                {renderItem('particlesRender', (perfData?.particlesRenderTime.lastSecAverage || 0).toFixed(2) + ' ms')}
                {renderItem('spritesRender', (perfData?.spritesRenderTime.lastSecAverage || 0).toFixed(2) + ' ms')}
                {renderItem('physics', (perfData?.physicsTime.lastSecAverage || 0).toFixed(2) + ' ms')}
                {renderItem('cameraRender', (perfData?.cameraRenderTime.lastSecAverage || 0).toFixed(2) + ' ms')}
              </Desc>
            ),
          },
          {
            key: 'project',
            label: '全局',
            children: (
              <Desc column={1}>
                {renderItem('GPU', `${((perfData?.gpuFrameTime.lastSecAverage || 0) / 1000 / 1000).toFixed(2)} ms/帧`)}
                {renderItem('着色器', formatSize(perfData?.shaderCompilationTime.count || 0) + ' 已编译')}
              </Desc>
            ),
          },
        ]}
      />
    </div>
  );
};
