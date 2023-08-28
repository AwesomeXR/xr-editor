import { ExternalImpl, ExtMimeMap } from 'ah-memory-fs';
import * as bjs from 'xr-impl-bjs/dist/bjs';
import { DefaultBizLogger } from '../common/lib/BizLogger';
import { IDTViewProps, IFlowNodeEdittimeData, IXRFlowNodeDTBizRender } from './IFlowNodeEdittimeData';
import { FlowNodeTypeRegistry, IFlowDTKey, IFlowNode, IFlowNodeClassNames, IFlowNodeMeta } from 'ah-flow-node';
import {
  EdittimeDebugNodeRegisterData,
  EdittimePBRComposerConnectNodeRegisterData,
  getConnectorNodeRegisterData,
  getDirectionalLightNodeRegisterData,
  getIntersectionNodeRegisterData,
  getNpcNavigateNodeRegisterData,
} from './EdittimeFlowNode';
import { FlowDTRegistry } from 'ah-flow-node';
import { IThirdPersonCameraNode_springMode, XRStageRegistry, setup as xrCoreSetup } from 'xr-core';
import { ColorFactory } from '../common/lib/ColorFactor';
import { FlowDataTypeStyle } from './FlowDataTypeStyle';
import { SceneModel, XRProjectModel } from './ViewModel';
import { CommonPrePublishStageCB } from './StageProcess/CommonPrePublishStageCB';
import { getPickableShapeNodeRegisterData } from './EdittimeFlowNode/redefine/PickableShapeNode';
import { RedefineWrapper } from './EdittimeFlowNode/redefine/wrapper';
import { BizField } from './component/BizField';
import { DTView } from './component/DTView';

// 载入内置扩展
import './BuiltinExtension';

declare module 'ah-flow-node' {
  interface IFlowNodeInput<T extends IFlowDTKey> {
    hiddenInGraph?: boolean;
    hiddenInPropertyPanel?: boolean;
    bizRender?: IXRFlowNodeDTBizRender;

    isPositionGizmoOrigin?: boolean; // 移动 giz 标记
  }
  interface IFlowNodeOutput<T extends IFlowDTKey> {
    hiddenInGraph?: boolean;
  }
  interface IFlowDTMap {
    EdittimeData: IFlowNodeEdittimeData;
  }
  interface IFlowHost {
    _edittime: {
      sceneModel: SceneModel;
    };
  }
  interface IFlowDTRegisterData {
    View?: React.FC<IDTViewProps>;
  }
}

declare module 'ah-api-type' {
  interface SchemaNumber {
    step?: number;
  }
  interface SchemaInteger {
    step?: number;
  }
}

let _isSetup = false;

export function XRSetup() {
  if (_isSetup) return;
  _isSetup = true;

  // mime
  Object.assign(ExtMimeMap, { '.ktx2': 'application/ktx2' });

  // ExternalImpl
  ExternalImpl.ArrayBufferToString = data => new TextDecoder().decode(data);
  ExternalImpl.StringToArrayBuffer = data => new TextEncoder().encode(data);

  xrCoreSetup();

  bjs.setup(DefaultBizLogger);

  // inject bjs debugger
  (bjs.DebugLayer as any).InspectorURL = undefined;
  (bjs.DebugLayer.prototype as any)._getGlobalInspector = function () {
    return { Inspector: bjs.Inspector };
  };

  // flow dt
  FlowDTRegistry.Default.register('EdittimeData', { serializer: 'JSON' });
  FlowDTRegistry.Default.merge('InputDefMap', { View: BizField.IODefMap });
  FlowDTRegistry.Default.merge('OutputDefMap', { View: BizField.IODefMap });
  FlowDTRegistry.Default.merge('String', { View: DTView.StringView });
  FlowDTRegistry.Default.merge('Number', { View: DTView.NumberView });
  FlowDTRegistry.Default.merge('Boolean', { View: DTView.BooleanView });
  FlowDTRegistry.Default.merge('JSON', { View: DTView.JSONView });

  FlowDTRegistry.Default.merge('InputDefs', { View: DTView.IODefsView });
  FlowDTRegistry.Default.merge('OutputDefs', { View: DTView.IODefsView });

  // edittime flow node
  FlowNodeTypeRegistry.Default.register('EdittimeDebugNode', EdittimeDebugNodeRegisterData);
  FlowNodeTypeRegistry.Default.register('EdittimePBRComposerConnectNode', EdittimePBRComposerConnectNodeRegisterData);

  FlowNodeTypeRegistry.Default.register('PickableShapeNode', getPickableShapeNodeRegisterData());
  FlowNodeTypeRegistry.Default.register('IntersectionNode', getIntersectionNodeRegisterData());
  FlowNodeTypeRegistry.Default.register('ConnectorNode', getConnectorNodeRegisterData());
  FlowNodeTypeRegistry.Default.register('DirectionalLightNode', getDirectionalLightNodeRegisterData());
  FlowNodeTypeRegistry.Default.register('NpcNavigateNode', getNpcNavigateNodeRegisterData());

  // redefine wrapper
  FlowNodeTypeRegistry.Default.getAllType().forEach(className => {
    let source = FlowNodeTypeRegistry.Default.get(className);
    if (!source) return;

    source = RedefineWrapper.moveable(source);

    // 好像有 bug 先关掉
    // source = RedefineWrapper.rotatable(source);

    if (className === 'CameraPlacementNode') {
      source = RedefineWrapper.relationLine(source, 'position', 'target');
      source = RedefineWrapper.locationIndicator(source, 'position', 'arrow', { lookAtTarget: 'target' });
    }
    //
    else if (className === 'DirectionalLightNode') {
      source = RedefineWrapper.relationLine(source, 'position', 'target');
      source = RedefineWrapper.locationIndicator(source, 'position', 'arrow', { lookAtTarget: 'target' });
    }

    FlowNodeTypeRegistry.Default.register(className, source);
  });

  // 注入编辑时属性
  FlowNodeTypeRegistry.Default.getAllType().forEach(className => {
    _mergeDefine(className, {
      __edittimeData: { dataType: 'EdittimeData', hiddenInGraph: true, hiddenInPropertyPanel: true },
      _meta: { title: '元数据', hiddenInGraph: true, bizRender: { type: 'JSON' } },
    });
  });

  _mergeDefine('AssetContainerNode', {
    url: { bizRender: { type: 'FileAssets', acceptExts: ['glb', 'gltf'] } },
    position: { isPositionGizmoOrigin: true },
    _inDefs: { hiddenInGraph: true, hiddenInPropertyPanel: true },
    _outDefs: { hiddenInGraph: true, hiddenInPropertyPanel: true },
  });
  _mergeDefine('MeshInstanceNode', {
    url: { bizRender: { type: 'FileAssets', acceptExts: ['glb', 'gltf'] } },
    position: { isPositionGizmoOrigin: true },
  });
  _mergeDefine('ArcRotateCameraNode', {
    alpha: { bizRender: _genNumberRender(0, 359, 1) },
    beta: { bizRender: _genNumberRender(0, 179, 1) },
    fov: { bizRender: _genNumberRender(0, 3) },
  });
  _mergeDefine('DirectionalLightNode', {
    target: { isPositionGizmoOrigin: true },
  });
  _mergeDefine('HDRNode', {
    intensity: { bizRender: _genNumberRender(0, 2) },
    rotationY: { bizRender: _genNumberRender(0, 359, 1) },
    url: { bizRender: { type: 'FileAssets', acceptExts: ['env'] } },
  });
  _mergeDefine('SkyBoxNode', {
    rotationY: { bizRender: _genNumberRender(0, 359, 1) },
    url: { bizRender: { type: 'FileAssets', acceptExts: ['jpg', 'jpeg', 'png', 'ktx2'] } },
  });

  _mergeDefine('DictionaryExpandNode', {
    keys: { hiddenInGraph: true, hiddenInPropertyPanel: true },
  });
  _mergeDefine('PBRMaterialNode', {
    alpha: { bizRender: _genNumberRender(0, 1, 0.1) },
    alphaCutOff: { bizRender: _genNumberRender(0, 1, 0.1) },
    metallic: { bizRender: _genNumberRender(0, 2) },
    roughness: { bizRender: _genNumberRender(0, 2) },
    emissiveIntensity: { bizRender: _genNumberRender(0, 2) },
    occlusionIntensity: { bizRender: _genNumberRender(0, 2) },
    clearcoatIntensity: { bizRender: _genNumberRender(0, 2) },
    clearcoatRoughness: { bizRender: _genNumberRender(0, 2) },
  });
  _mergeDefine('TextureNode', { source: { bizRender: { type: 'FileAssets', acceptExts: ['png', 'jpg', 'ktx2'] } } });
  _mergeDefine('DictionaryCastNode', {
    extraTargetIoDefs: { hiddenInGraph: true, hiddenInPropertyPanel: true },
    mode: {
      bizRender: {
        type: 'JSON',
        schema: { type: 'string', enum: ['assign', 'set'] },
      },
    },
  });
  _mergeDefine('ScalarOperateNode', { argCnt: { hiddenInGraph: true } });
  _mergeDefine('ThirdPersonCameraNode', {
    alpha: { bizRender: _genNumberRender(0, 359, 1) },
    beta: { bizRender: _genNumberRender(0, 179, 1) },
    springMode: {
      bizRender: {
        type: 'JSON',
        schema: { type: 'string', enum: ['collision', 'occlusion', 'none'] as IThirdPersonCameraNode_springMode[] },
      },
    },
  });
  _mergeDefine('BackgroundMusicNode', {
    url: { bizRender: { type: 'FileAssets', acceptExts: ['mp3', 'ogg', 'wav', 'webm'] } },
  });
  _mergeDefine('PictureNode', {
    url: { bizRender: { type: 'FileAssets', acceptExts: ['png', 'jpg', 'ktx2'] } },
    position: { isPositionGizmoOrigin: true },
  });
  _mergeDefine('FurNode', {
    textureUrl: { bizRender: { type: 'FileAssets', acceptExts: ['png', 'jpg', 'ktx2'] } },
    heightTextureUrl: { bizRender: { type: 'FileAssets', acceptExts: ['png', 'jpg', 'ktx2'] } },
  });
  _mergeDefine('WaterNode', {
    colorBlendFactor: { bizRender: _genNumberRender(0, 1, 0.1) },
    groundTextureScale: { bizRender: _genNumberRender(0, undefined, 0.1) },
    groundTextureUrl: { bizRender: { type: 'FileAssets', acceptExts: ['png', 'jpg', 'ktx2'] } },
  });
  _mergeDefine('MiniMapNode', { imgUrl: { bizRender: { type: 'FileAssets', acceptExts: ['png', 'jpg'] } } });
  _mergeDefine('Vector3OperateNode', { argCnt: { hiddenInGraph: true } });
  _mergeDefine('FunctionNode', { code: { bizRender: { type: 'CodeEditor', lang: 'javascript' } } });
  _mergeDefine('LerpNode', {
    dataType: { bizRender: { type: 'JSON', schema: { type: 'string', enum: FlowDTRegistry.Default.getAllType() } } },
  });
  _mergeDefine('CameraPlacementNode', {
    position: { isPositionGizmoOrigin: true },
  });
  _mergeDefine('IntersectionNode', {
    position: { isPositionGizmoOrigin: true },
  });
  _mergeDefine('ComponentInputNode', { inputDefs: { hiddenInGraph: true } });
  _mergeDefine('ComponentOutputNode', { outputDefs: { hiddenInGraph: true } });
  _mergeDefine('ComponentNode', { componentID: { hiddenInGraph: true } });

  const DTKeys: IFlowDTKey[] = FlowDTRegistry.Default.getAllType();
  const color = ColorFactory.create(DTKeys.length);

  DTKeys.forEach((key, i) => {
    FlowDataTypeStyle[key] = { color: color(i) };
  });

  // register xr stage
  XRStageRegistry.Default.register('beforePublish', '*', CommonPrePublishStageCB);
}

const _mergeDefine = <C extends IFlowNodeClassNames>(
  className: C,
  inputs: Partial<Record<keyof IFlowNode<C>['input'], any>>,
  outputs: Partial<Record<keyof IFlowNode<C>['output'], any>> = {}
) => {
  const impl = FlowNodeTypeRegistry.Default.get(className);
  if (!impl) return;

  if (!impl.define) throw new Error('missing define: ' + className);

  for (const inKey of Object.keys(inputs)) {
    if (!(impl.define.input as any)[inKey]) (impl.define.input as any)[inKey] = { dataType: 'Message' };
    Object.assign((impl.define.input as any)[inKey], (inputs as any)[inKey]);
  }

  for (const outKey of Object.keys(outputs)) {
    if (!(impl.define.output as any)[outKey]) (impl.define.output as any)[outKey] = { dataType: 'Message' };
    Object.assign((impl.define.output as any)[outKey], (outputs as any)[outKey]);
  }
};

const _genNumberRender = (min?: number, max?: number, step?: number): IXRFlowNodeDTBizRender => ({
  type: 'JSON',
  schema: { type: 'number', min, max, step },
});
