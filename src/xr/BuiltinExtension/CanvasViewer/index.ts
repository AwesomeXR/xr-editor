import { XRExtensionRegistry } from '../../XRExtensionRegistry';
import { CanvasViewer } from './CanvasViewer';
import { CanvasViewerModel } from './CanvasViewerModel';

// 注册扩展
XRExtensionRegistry.Default.register('CanvasViewer', {
  panels: [
    {
      component: 'CanvasViewer',
      title: '3D 画布',
      icon: 'file_3D',
      model: CanvasViewerModel,
      view: CanvasViewer,
      allowedSlots: ['main'],
    },
  ],
});
