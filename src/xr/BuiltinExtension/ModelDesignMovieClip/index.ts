import { XRExtensionRegistry } from '../../XRExtensionRegistry';
import { ModelDesignMovieClip } from './ModelDesignMovieClip';
import { ModelDesignMovieClipModel } from './ModelDesignMovieClipModel';

XRExtensionRegistry.Default.register('ModelDesignMovieClip', {
  panels: [
    {
      component: 'ModelDesignMovieClip',
      icon: 'file_movie',
      title: '动画',
      model: ModelDesignMovieClipModel,
      view: ModelDesignMovieClip,
      allowedSlots: ['main'],
    },
  ],
});
