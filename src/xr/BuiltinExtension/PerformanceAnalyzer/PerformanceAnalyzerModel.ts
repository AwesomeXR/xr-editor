import { IBizIconName } from '../../../common/component/BizIcon';
import { CommandSystem } from '../../ViewModel/CommandSystem';
import { CameraModeEnum } from '../../ViewModel/Scene/CameraModule';
import { PanelModel } from '../../ViewModel/Workbench/PanelModel';

export type IPerformanceAnalyzerModelProps = {};
export type IPerformanceAnalyzerModelState = {};

export class PerformanceAnalyzerModel extends PanelModel<
  IPerformanceAnalyzerModelProps,
  IPerformanceAnalyzerModelState,
  {}
> {
  restore(props: IPerformanceAnalyzerModelProps): void {}

  save(): IPerformanceAnalyzerModelProps {
    return {};
  }
}
