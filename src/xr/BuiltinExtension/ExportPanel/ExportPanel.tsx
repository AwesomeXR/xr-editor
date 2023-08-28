import React, { useContext } from 'react';
import { usePanelModel } from '../../hook/usePanelModel';
import { useFWHeaderSlot, useForceUpdate, useListen } from '../../../common';
import { XREditorContext } from '../../XREditorContext';
import { PublishPropertyPanel } from './PublishPropertyPanel';
import { ExportPanelModel } from './ExportPanelModel';

export interface IExportPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ExportPanel = ({ className, style }: IExportPanelProps) => {
  const fu = useForceUpdate();
  const ctx = useContext(XREditorContext);
  const headerSlot = useFWHeaderSlot();
  const model = usePanelModel<ExportPanelModel>('ExportPanel');

  useListen(model.event, 'afterStateChange', fu.update);

  return (
    <>
      <div
        data-name='ExportPanel'
        className={className}
        style={{ position: 'relative', height: '100%', width: '100%', ...style }}
      >
        <PublishPropertyPanel model={model} />
      </div>
    </>
  );
};
