import React, { useContext } from 'react';
import { usePanelModel } from '../../hook/usePanelModel';
import { useFWHeaderSlot, useForceUpdate, useListen } from '../../../common';
import { BizXRPanelMenuBar } from '../../component/BizXRPanelMenuBar';
import { PropertyPanel } from './PropertyPanel';
import { XREditorContext } from '../../XREditorContext';
import { ModelDesignPropertyModel } from './ModelDesignPropertyModel';

export interface IModelDesignPropertyProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ModelDesignProperty = ({ className, style }: IModelDesignPropertyProps) => {
  const fu = useForceUpdate();
  const ctx = useContext(XREditorContext);
  const headerSlot = useFWHeaderSlot();
  const model = usePanelModel<ModelDesignPropertyModel>('ModelDesignProperty');

  useListen(model.event, 'afterStateChange', fu.update);
  useListen(model.project.event, 'afterActiveSceneChange', fu.update);
  useListen(ctx.project.event, 'scene:modelDesign:afterStateChange', fu.update);
  useListen(ctx.project.event, 'scene:modelDesign:outline:afterAllChange', fu.update);
  useListen(ctx.project.event, 'scene:modelDesign:outline:afterSelectChange', fu.update);

  return (
    <>
      {headerSlot(<BizXRPanelMenuBar />)}
      <div
        data-name='ModelDesignProperty'
        className={className}
        style={{ position: 'relative', height: '100%', width: '100%', ...style }}
      >
        <PropertyPanel model={model} activeNode={model.activeNode} />
      </div>
    </>
  );
};
