import React, { useContext } from 'react';
import { usePanelModel } from '../../hook/usePanelModel';
import { Empty, useFWHeaderSlot, useForceUpdate, useListen } from '../../../common';
import { XREditorContext } from '../../XREditorContext';
import { LightTree } from '../../../common/component/LightTree';
import { Timeline } from './Timeline';
import { Header } from './Header';
import { ModelDesignMovieClipModel } from './ModelDesignMovieClipModel';

export interface IModelDesignMovieClipProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ModelDesignMovieClip = ({ className, style }: IModelDesignMovieClipProps) => {
  const fu = useForceUpdate();
  const ctx = useContext(XREditorContext);
  const headerSlot = useFWHeaderSlot();
  const model = usePanelModel<ModelDesignMovieClipModel>('ModelDesignMovieClip');

  useListen(model.project.event, 'afterActiveSceneChange', fu.update);
  useListen(model.event, 'afterStateChange', fu.update);
  useListen(model.movieClip.event, 'afterClipConfigChange', fu.update);
  useListen(model.outline.event, '__nodesForRenderChange', fu.update);

  const hasData = model.outline.nodesForRender.length > 0;

  return (
    <>
      {headerSlot(<Header model={model} />)}
      <div
        data-name='ModelDesignMovieClip'
        className={className}
        style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', ...style }}
      >
        {hasData ? (
          <>
            <div style={{ width: 300 }}>
              <div style={{ height: 24 }}></div>
              <LightTree model={model.outline} />
            </div>
            <Timeline model={model} style={{ flex: 1, width: 1 }} />
          </>
        ) : (
          <Empty description='暂无动画数据' image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ width: '100%' }} />
        )}
      </div>
    </>
  );
};
