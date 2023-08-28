import { XRExtensionRegistry } from '../../XRExtensionRegistry';
import { ModelDesignOutline } from './ModelDesignOutline';
import { ModelDesignOutlineModel } from './ModelDesignOutlineModel';

XRExtensionRegistry.Default.register('ModelDesignOutline', {
  panels: [
    {
      component: 'ModelDesignOutline',
      title: '大纲',
      icon: 'outliner',
      model: ModelDesignOutlineModel,
      view: ModelDesignOutline,
      allowedSlots: ['main'],
    },
  ],
});
