import { XRExtensionRegistry } from '../../XRExtensionRegistry';
import { ExportPanel } from './ExportPanel';
import { ExportPanelModel } from './ExportPanelModel';

// 注册扩展
XRExtensionRegistry.Default.register('ExportPanel', {
  panels: [
    {
      component: 'ExportPanel',
      title: '导出',
      model: ExportPanelModel,
      view: ExportPanel,
      allowedSlots: ['main'],
    },
  ],
});
