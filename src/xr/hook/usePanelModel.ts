import { useContext } from 'react';
import { FWContext } from '../../common';
import { XREditorContext } from '../XREditorContext';
import { PanelModel } from '../ViewModel';

export function usePanelModel<T extends PanelModel<any, any, any>>(name?: string): T {
  const ctx = useContext(XREditorContext);
  const wb = useContext(FWContext);

  if (wb.currentLayout.type !== 'Component') throw new Error('layout is not component: ' + wb.currentLayout.key);
  if (name && wb.currentLayout.component !== name) throw new Error('component name error: ' + name);

  // 从 viewModel 里获取一个 panelModel
  const model = ctx.project.workbench.getPanelModel(wb.currentLayout.key);
  return model as any as T;
}
