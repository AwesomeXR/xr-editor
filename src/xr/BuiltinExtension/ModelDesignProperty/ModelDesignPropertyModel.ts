import { PanelModel } from '../../ViewModel/Workbench/PanelModel';

export type IModelDesignPropertyModelProps = {};
export type IModelDesignPropertyModelState = {};
export type IModelDesignPropertyModelEvent = {};

export class ModelDesignPropertyModel extends PanelModel<
  IModelDesignPropertyModelProps,
  IModelDesignPropertyModelState,
  IModelDesignPropertyModelEvent
> {
  restore(props: IModelDesignPropertyModelProps | undefined): void {
    if (props) this.updateState(props);
  }

  save(): IModelDesignPropertyModelProps {
    return {};
  }

  // quick access
  get activeNode() {
    return this.project.activeScene?.modelDesign?.outline.activeNode;
  }

  // quick access
  get outline() {
    return this.project.activeScene?.modelDesign?.outline;
  }

  get modelDesign() {
    return this.project.activeScene?.modelDesign;
  }
}
