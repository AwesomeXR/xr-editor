import { PanelModel } from '../../ViewModel/Workbench/PanelModel';

export type IModelDesignOutlineModelProps = {};
export type IModelDesignOutlineModelState = {};
export type IModelDesignOutlineModelEvent = {};

export class ModelDesignOutlineModel extends PanelModel<
  IModelDesignOutlineModelProps,
  IModelDesignOutlineModelState,
  IModelDesignOutlineModelEvent
> {
  restore(props: IModelDesignOutlineModelProps | undefined): void {
    if (props) this.updateState(props);
  }

  save(): IModelDesignOutlineModelProps {
    return {};
  }

  // quick access
  get outline() {
    return this.project.activeScene?.modelDesign?.outline;
  }
}
