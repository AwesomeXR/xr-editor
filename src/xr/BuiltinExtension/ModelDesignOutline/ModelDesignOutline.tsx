import React, { useContext } from 'react';
import { usePanelModel } from '../../hook/usePanelModel';
import { useFWHeaderSlot, useForceUpdate, useListen } from '../../../common';
import { XREditorContext } from '../../XREditorContext';
import { LightTree } from '../../../common/component/LightTree';
import { Header } from './Header';
import { ModelDesignOutlineModel } from './ModelDesignOutlineModel';

export interface IModelDesignOutlineProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ModelDesignOutline = ({ className, style }: IModelDesignOutlineProps) => {
  const fu = useForceUpdate();
  const ctx = useContext(XREditorContext);
  const headerSlot = useFWHeaderSlot();
  const model = usePanelModel<ModelDesignOutlineModel>('ModelDesignOutline');

  useListen(model.event, 'afterStateChange', fu.update);
  useListen(model.project.event, 'afterActiveSceneChange', fu.update);

  const outline = model.outline;
  if (!outline) return null;

  return (
    <>
      {headerSlot(<Header model={model} />)}
      <div
        data-name='ModelDesignOutline'
        className={className}
        style={{ position: 'relative', height: '100%', width: '100%', ...style }}
        onDragOver={ev => ev.preventDefault()}
        onDrop={ev => ctx.project.activeScene?.processFileDrop(ev)}
      >
        <LightTree model={outline} />
      </div>
    </>
  );
};
