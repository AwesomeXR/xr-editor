import { theme } from 'antd';
import React, { useContext, useLayoutEffect, useRef } from 'react';
import { useFWPanelSize, useFWHeaderSlot, useForceUpdate, useListen } from '../../../common';
import { XREditorContext } from '../../XREditorContext';
import { usePanelModel } from '../../hook/usePanelModel';
import { Header } from './Header';
import { AnimationBar } from './AnimationBar';
import cx from 'classnames';
import './style.less';
import { CanvasViewerModel } from './CanvasViewerModel';

export interface ICanvasViewerProps {
  className?: string;
  style?: React.CSSProperties;
}

export const CanvasViewer = ({ className, style }: ICanvasViewerProps) => {
  const ctx = useContext(XREditorContext);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const pSize = useFWPanelSize();
  const headerSlot = useFWHeaderSlot();
  const { token } = theme.useToken();

  const model = usePanelModel<CanvasViewerModel>('CanvasViewer');
  const fu = useForceUpdate();

  const viewport = ctx.project.viewport || { type: 'auto' };

  useLayoutEffect(() => {
    if (canvasHostRef.current) {
      const canvasEle = ctx.project.engine.getRenderingCanvas();
      if (!canvasEle) return;

      if (canvasEle.parentElement !== canvasHostRef.current) {
        canvasHostRef.current.innerHTML = '';
        canvasHostRef.current.appendChild(canvasEle);
      }

      const evaluatedSize = ctx.project.evaluateViewport(pSize.width, pSize.height);
      ctx.project.engine.setSize(evaluatedSize.width, evaluatedSize.height);
    }
  }, [pSize.width, pSize.height, viewport]);

  useListen(ctx.project.event, 'scene:camera:afterCameraChange', fu.update);
  useListen(ctx.project.event, 'scene:afterActiveCameraChange', fu.update);
  useListen(ctx.project.event, 'scene:afterGizmoStateChange', fu.update);
  useListen(ctx.project.event, 'scene:world:afterGroundChange', fu.update);
  useListen(ctx.project.event, 'scene:world:afterCursorChange', fu.update);
  useListen(ctx.project.event, 'afterViewportChange', fu.update);
  useListen(ctx.project.event, 'afterViewportResize', fu.update);
  useListen(ctx.project.event, 'afterActiveSceneChange', fu.update);
  useListen(model.event, 'afterStateChange', fu.update);

  const scene = ctx.project.activeScene;
  if (!scene) return null;

  const rSize = ctx.project.getRenderingCanvasSize();

  return (
    <>
      {headerSlot(<Header model={model} />)}

      <div
        data-name='CanvasViewer'
        className={cx(className, 'CanvasViewer', `viewport-${viewport.type}`)}
        style={{ ...style }}
        onDragOver={ev => ev.preventDefault()}
        onDrop={ev => ctx.project.activeScene?.processFileDrop(ev)}
      >
        <div
          ref={canvasHostRef}
          className='transparent-board CanvasViewer-Host'
          style={{
            width: rSize.clientWidth,
            height: rSize.clientHeight,
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
            overflow: 'hidden',
          }}
        />

        <AnimationBar model={model} style={{ position: 'absolute', left: 0, bottom: 0, width: '100%' }} />
      </div>
    </>
  );
};
