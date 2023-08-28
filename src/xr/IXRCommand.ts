import { Deferred } from 'xr-core';
import { IFlowNodeClassNames, IFlowNodeSerializerData } from 'ah-flow-node';
import { ISceneGizmoState } from './ViewModel';
import { AssetContainerOpAction } from './lib/AssetContainerOp';
import { IWBConfigData } from '../common';

export type IXRCommand = {
  // project
  Save: null;
  Publish: {
    syncEDCameraToPreview?: { allowControl?: boolean; allowMove?: boolean };
    extraTplData?: any;
    toLocal?: boolean;
  };
  Lint: null;
  Pause: { pause?: boolean };

  Import: { url: string };
  Export: {};

  Redo: {};
  Undo: {};

  Copy: { data: string };
  Paste: {};

  CreateScene: {};
  CloneScene: { ID?: string };
  RemoveScene: { ID?: string };

  UpdateSceneMeta: { ID: string; title?: string; poster?: string };

  SwitchActiveScene: { ID?: string };
  ExportFile: { filepaths: string[] };

  InvokePanel: { ID?: string; method: string; arg?: string };

  CreatePBRComposer: {};

  // workbench
  WB_Add: { config?: IWBConfigData | string };
  WB_Remove: { index: number };
  WB_Switch: { index: number };
  WB_Update: { index: number; title?: string };

  // pbr project
  PBRC_AddLayer: { composer: string; slot: string };

  // mfs
  MFS_Unlink: { paths: string[] };
  MFS_Mkdir: { activePath?: string; dirname?: string };
  MFS_Move: { fromPath: string; toPath: string };

  // scene
  Scene_AddFlowNode: { className: IFlowNodeClassNames } & Partial<IFlowNodeSerializerData<IFlowNodeClassNames>>;
  Scene_RemoveFlowNode: { IDs?: string[]; removeVirtualChildren?: boolean };
  Scene_UpdateFlowNode: { IDs: string[]; propPath: string; value: any /** 这个 value 只能填 JSON */ };
  Scene_ApplyFlowNodeTpl: { ID: string; tpl: string };

  Scene_SwitchActiveCamera: { name: string };
  Scene_UpdateWorld: { groundVisible?: boolean };

  // 编辑态相机
  Scene_UpdateEDCamera: { sceneID?: string; mode?: number; target?: number[] | 'cursor' | 'picked' };

  // 游标
  Scene_UpdateCursor: { sceneID?: string; enabled?: boolean };

  // gizmo
  Scene_CameraGizmo_Toggle: { sceneID: string; name: string };
  Scene_UpdateGizmoState: {
    sceneID: string;
    state: Partial<ISceneGizmoState>;
  };

  // file type util
  File_Image_TextureCompress: {
    path: string;
    uastc?: boolean;
    ktx2_no_zstandard?: boolean;
    linear?: boolean;
    uastc_level?: number;
    y_flip?: boolean;
    normal_map?: boolean;
  };
  File_Image_ResizeSquare: { path: string; size: number };
  File_GLTF_Optimize: { path: string };

  // asset container
  AssetContainer_Op: {
    ID: string;
    action: AssetContainerOpAction;
  };
};

export type ICommandSystemHandler<C extends keyof IXRCommand> = (
  arg?: IXRCommand[C],
  defer?: Deferred<void>
) => { undo: (defer: Deferred<void>) => any; redo: (defer: Deferred<void>) => any } | void;

export type ICommandSystemImpl = {
  [C in keyof IXRCommand as `_handle_${C}`]: ICommandSystemHandler<C>;
};
