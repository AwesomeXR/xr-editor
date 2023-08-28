import { XRExtensionRegistry } from '../../XRExtensionRegistry';
import { FlowEditor } from './FlowEditor';
import { FlowEditorModel } from './FlowEditorModel';

XRExtensionRegistry.Default.register('FlowEditor', {
  panels: [
    {
      component: 'FlowEditor',
      icon: 'system',
      title: '蓝图',
      model: FlowEditorModel,
      view: FlowEditor,
      allowedSlots: ['main'],
    },
  ],
});
