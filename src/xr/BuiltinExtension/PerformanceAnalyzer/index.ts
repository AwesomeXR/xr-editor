import { XRExtensionRegistry } from '../../XRExtensionRegistry';
import { PerformanceAnalyzer } from './PerformanceAnalyzer';
import { PerformanceAnalyzerModel } from './PerformanceAnalyzerModel';

XRExtensionRegistry.Default.register('PerformanceAnalyzer', {
  panels: [
    {
      component: 'PerformanceAnalyzer',
      title: '性能监视器',
      icon: 'memory',
      model: PerformanceAnalyzerModel,
      view: PerformanceAnalyzer,
      allowedSlots: ['side'],
    },
  ],
});
