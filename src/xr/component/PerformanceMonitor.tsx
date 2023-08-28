import { Divider, Space, Typography } from 'antd';
import React, { useContext } from 'react';
import { XREditorContext } from '../XREditorContext';
import { formatSize } from '../../common/lib/formatSize';
import { useForceUpdate, useListen } from '../../common';

export interface IPerformanceMonitorProps {
  className?: string;
  style?: React.CSSProperties;
}

export const PerformanceMonitor = ({ className, style }: IPerformanceMonitorProps) => {
  const ctx = useContext(XREditorContext);
  const fu = useForceUpdate();

  useListen(ctx.project.event, 'performance:afterPerfDataChange', fu.update);

  const perfData = ctx.project.performance.perfData;

  return (
    <Space size={0} split={<Divider type='vertical' />} className={className} style={style}>
      <Typography.Text>FPS:{(perfData?.fps || 0)?.toFixed(0)}</Typography.Text>
      <Typography.Text>DrawCalls:{formatSize(perfData?.drawCalls || 0)}</Typography.Text>

      <Typography.Text>
        GPU: {((perfData?.gpuFrameTime.lastSecAverage || 0) / 1000 / 1000).toFixed(2)}ms/帧
      </Typography.Text>
      <Typography.Text>着色器: {formatSize(perfData?.shaderCompilationTime.count || 0)}已编译</Typography.Text>

      {/* <Typography.Text>FPS:{(scenePerf?.fps || 0)?.toFixed(0)}</Typography.Text>
      <Typography.Text>活动对象:{formatSize(scenePerf?.activeMeshes || 0)}</Typography.Text>
      <Typography.Text>活动顶点:{formatSize(scenePerf?.activeIndices || 0)}</Typography.Text>
      <Typography.Text>活动骨骼:{formatSize(scenePerf?.activeBones || 0)}</Typography.Text>
      <Typography.Text>活动粒子系统:{formatSize(scenePerf?.activeParticles || 0)}</Typography.Text>
      <Typography.Text>DrawCalls:{formatSize(scenePerf?.drawCalls || 0)}</Typography.Text> */}
    </Space>
  );
};
