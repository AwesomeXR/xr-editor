import { XRExtensionRegistry } from '../../XRExtensionRegistry';
import { FileExplorer } from './FileExplorer';
import { FileExplorerModel } from './FileExplorerModel';

XRExtensionRegistry.Default.register('FileExplorer', {
  panels: [
    {
      component: 'FileExplorer',
      icon: 'file',
      title: '文件浏览器',
      model: FileExplorerModel,
      view: FileExplorer,
      allowedSlots: ['side'],
    },
  ],
});
