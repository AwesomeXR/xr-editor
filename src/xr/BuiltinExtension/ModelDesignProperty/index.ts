import { XRExtensionRegistry } from '../../XRExtensionRegistry';
import { ModelDesignProperty } from './ModelDesignProperty';
import { ModelDesignPropertyModel } from './ModelDesignPropertyModel';

XRExtensionRegistry.Default.register('ModelDesignProperty', {
  panels: [
    {
      component: 'ModelDesignProperty',
      title: '属性',
      icon: 'options',
      model: ModelDesignPropertyModel,
      view: ModelDesignProperty,
      allowedSlots: ['main'],
    },
  ],
});
