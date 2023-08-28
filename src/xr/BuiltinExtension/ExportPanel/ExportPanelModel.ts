import { PanelModel } from '../../ViewModel/Workbench/PanelModel';
import { MovieClipHelper } from '../../lib/MovieClipHelper';
import { VideoComposerHelper } from '../../lib/VideoComposerHelper';

export type IExportMode = 'H5' | 'Image' | 'Video';

export type IExportPanelModelProps = {
  mode?: IExportMode;
  publish?: any;
  videoComposer?: any;
};
export type IExportPanelModelState = {
  mode: IExportMode;
  loading?: boolean;

  publish?: {
    logo?: string;
    backgroundImage?: string;
    allowControl?: boolean;
    allowMove?: boolean;
  };
  videoComposer?: {
    vpScale?: number;
    sampleRate?: number;
    quality?: number;
  };
};
export type IExportPanelModelEvent = {};

export class ExportPanelModel extends PanelModel<
  IExportPanelModelProps,
  IExportPanelModelState,
  IExportPanelModelEvent
> {
  readonly movieClip = new MovieClipHelper();
  composer!: VideoComposerHelper;

  restore(props: IExportPanelModelProps | undefined): void {
    this.updateState({
      mode: props?.mode ?? 'H5',
      publish: props?.publish || { allowControl: true, allowMove: true },
      videoComposer: props?.videoComposer || { vpScale: 1, sampleRate: 30, quality: 0.7 },
    });

    this.composer = new VideoComposerHelper(this.project.activeScene!);
    this.composer.clipHelper = this.movieClip;

    const _clipNode = this.scene?.rootFlowHost?.flowNodeManager.lookup('默认动画剪辑', 'MovieClipNode');
    if (_clipNode) this.movieClip.bind(_clipNode);
  }

  save(): IExportPanelModelProps {
    return {
      mode: this.state.mode,
      videoComposer: this.state.videoComposer,
      publish: this.state.publish,
    };
  }

  dispose(): void {
    super.dispose();
    this.movieClip.unbind();
  }
}
