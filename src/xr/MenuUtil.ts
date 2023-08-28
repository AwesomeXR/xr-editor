import { IFlowNodeClassNames, FlowNodeTypeRegistry, IDefaultFlowNode, Util } from 'ah-flow-node';
import { IBizMenuItem } from '../common/component/BizMenu';
import { CommandSystem } from './ViewModel/CommandSystem';
import { IconUtil } from './IconUtil';
import { SceneModel, XRProjectModel } from './ViewModel';
import { ClipboardModel } from './ViewModel/ClipboardModel';
import { BizFlowNodeUtil } from './lib';
import _ from 'lodash';
import { buildCommand } from './BuildCommand';

export const MenuUtil = {
  flowNodeItem(project: XRProjectModel, nodes: IDefaultFlowNode[]): IBizMenuItem[] {
    if (nodes.length === 0) return [];

    const IDs = nodes.map(n => n.ID);
    const scene = nodes[0].host;

    const list: IBizMenuItem[] = [
      {
        title: '复制',
        icon: 'copy_down',
        ...buildCommand('Copy', {
          data: ClipboardModel.build({ type: 'FlowNode', ...BizFlowNodeUtil.calcNodeCloneDataWitGroup(scene, nodes) }),
        }),
      },
      {
        title: '启用',
        icon: nodes.every(n => n.enabled) ? 'checkmark' : undefined,
        ...buildCommand('Scene_UpdateFlowNode', {
          IDs,
          propPath: 'enabled',
          value: !nodes.every(n => n.enabled),
        }),
      },
      { title: '删除', icon: 'trash', ...buildCommand('Scene_RemoveFlowNode', { IDs }) },
    ];

    if (nodes.length === 1 && Util.isFlowNode('AssetContainerNode', nodes[0])) {
      list.push({
        title: '应用动画控制器',
        ...buildCommand('Scene_ApplyFlowNodeTpl', { ID: nodes[0].ID, tpl: 'ModelAniCtrlComp' }),
      });
    }

    return list;
  },

  flowNodeAddItem(scene: SceneModel, groupID?: string, hocGroupID?: string): IBizMenuItem[] {
    const _genItem = (className: IFlowNodeClassNames): IBizMenuItem => {
      return {
        title: FlowNodeTypeRegistry.Default.get(className)?.define.cnName || className,
        icon: IconUtil.flowNodeIcon(className),
        disabled: scene.rootFlowHost?.flowNodeManager.all.some(
          n => n._define.className === className && n._define.singleton
        ),
        ...buildCommand('Scene_AddFlowNode', { className, hocGroupID, inputValues: { _groupID: groupID } }),
      };
    };

    return [
      {
        title: '场景',
        icon: 'scene_data',
        children: [
          _genItem('SceneNode'),
          _genItem('HDRNode'),
          _genItem('SkyBoxNode'),
          _genItem('BackgroundMusicNode'),
          _genItem('MiniMapNode'),
        ],
      },
      {
        title: '模型',
        icon: 'mesh_data',
        children: [
          _genItem('AssetContainerNode'),
          _genItem('MeshInstanceNode'),
          _genItem('PictureNode'),
          _genItem('MeshNode'),
          _genItem('PickableShapeNode'),
        ],
      },
      {
        title: '灯光',
        icon: 'light',
        children: [_genItem('DirectionalLightNode')],
      },
      {
        title: '相机',
        icon: 'camera_data',
        children: [
          _genItem('ArcRotateCameraNode'),
          _genItem('FreeCameraNode'),
          _genItem('ThirdPersonCameraNode'),
          _genItem('CameraPlacementNode'),
        ],
      },
      {
        title: '材质/纹理',
        icon: 'material',
        children: [_genItem('PBRMaterialNode'), _genItem('TextureNode'), _genItem('AnimatedTextureNode')],
      },
      {
        title: '动画',
        icon: 'anim_data',
        children: [_genItem('AnimatorNode'), _genItem('MovieClipNode')],
      },
      {
        title: '控制器',
        icon: 'anim_data',
        children: [
          _genItem('FrameTimerNode'),
          _genItem('SequenceGeneratorNode'),
          _genItem('CurveDriverNode'),
          _genItem('JoystickNode'),
          _genItem('NpcNavigateNode'),
          _genItem('LODNode'),
          _genItem('LerpNode'),
          _genItem('CameraControllerNode'),
          _genItem('LookAtTargetNode'),
          _genItem('IntersectionNode'),
        ],
      },
      {
        title: '特效',
        icon: 'system',
        children: [_genItem('FurNode'), _genItem('WaterNode'), _genItem('ShadowOnlyNode')],
      },
      {
        title: '标量/矢量',
        icon: 'con_transform',
        children: [
          _genItem('ScalarClampNode'),
          _genItem('ScalarOperateNode'),
          _genItem('Vector3Node'),
          _genItem('Vector3OperateNode'),
        ],
      },
      {
        title: '模块化',
        icon: 'action',
        children: [
          _genItem('ComponentNode'),
          _genItem('ComponentInputNode'),
          _genItem('ComponentOutputNode'),
          _genItem('ConnectorNode'),
        ],
      },
      {
        title: '其他',
        icon: 'file_3D',
        children: [
          _genItem('ThrottleNode'),
          _genItem('JSONDataNode'),
          _genItem('ArrayConcatNode'),
          _genItem('DataExpandNode'),
          _genItem('DictionaryExpandNode'),
          _genItem('DictionaryCastNode'),
          _genItem('FunctionNode'),
          _genItem('EdittimeDebugNode'),
        ],
      },
    ];
  },
};
