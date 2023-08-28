import { IXRRuntimeConfig } from 'xr-core';
import { IPBRComposerModelSeqData } from './ViewModel/PBRComposerModel';
import { ISceneGizmoState, IViewportConfig } from './ViewModel';
import { IModelDesignModelProps } from './ViewModel/Scene/ModelDesignModel';
import { IWBConfigData } from '../common';

export type IXREditorTargetCameraConfig = {
  alpha: number;
  beta: number;
  radius: number;
  target: number[];
  wheelPrecision?: number;
};

export type IXREditorSceneConfig_gizmo = {
  camera?: Record<string, any>;
};

export type IXREditorSceneConfig = {
  edittimeTargetCamera?: {
    alpha: number;
    beta: number;
    radius: number;
    target: number[];
    wheelPrecision?: number;
  };
  gizmo?: IXREditorSceneConfig_gizmo;
  cursor?: { enabled: boolean; position?: number[] };
  flowNodeEditor?: {
    pages: { ID: string; title?: string; viewport?: { x: number; y: number; zoom: number } }[];
  };

  activeFlowHocGroupID?: string;

  /** script 编译入口文件 */
  scriptEntry?: string;

  gizState?: ISceneGizmoState;
  modelDesign?: IModelDesignModelProps;
};

export type IXREditorPublishData = {
  timestamp: number;
  indexEntryURL: string;
  rtConfig: IXRRuntimeConfig;
  mfs: { url: string; indexKey: string };
};

export type IXREditorConfig = IXRRuntimeConfig & {
  editor: {
    workbench: {
      wbConfigList?: IWBConfigData[];
      wbConfigIdx?: number;

      outline?: { selectIds: string[]; expandIds: string[] };

      /** @deprecated */
      wbConfig?: IWBConfigData;
    };

    activeSceneID?: string;
    scene: Record<string, IXREditorSceneConfig>;

    latestPublishData?: IXREditorPublishData;

    pbrComposers?: IPBRComposerModelSeqData[];
    viewport?: IViewportConfig;
  };
};
