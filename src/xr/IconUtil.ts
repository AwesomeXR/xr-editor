import { IFlowNodeClassNames } from 'ah-flow-node';
import { IBizIconName } from '../common/component/BizIcon';

export const IconUtil = {
  flowNodeIcon(className: IFlowNodeClassNames): IBizIconName {
    const _map: Record<IFlowNodeClassNames, IBizIconName> = {
      HelloWorld: 'file_3D',
      AnimatorNode: 'anim',
      ArcRotateCameraNode: 'camera_data',
      AssetContainerNode: 'file_3D',
      DictionaryExpandNode: 'library_data_override',
      DirectionalLightNode: 'light_sun',
      HDRNode: 'lightprobe_cubemap',
      SkyBoxNode: 'cube',
      TextureNode: 'texture',
      DictionaryCastNode: 'library_data_direct',
      PBRMaterialNode: 'material',
      ProceduralPBRMaterialNode: 'node_material',
      FrameTimerNode: 'keyframe',
      SequenceGeneratorNode: 'time',
      InputPortNode: 'file_3D',
      Vector3Node: 'empty_data',
      EdittimeDebugNode: 'file_3D',
      EdittimePBRComposerConnectNode: 'file_3D',
      ScalarClampNode: 'normalize_fcurves',
      FreeCameraNode: 'camera_data',
      MeshNode: 'mesh_data',
      SceneNode: 'scene_data',
      CurveDriverNode: 'file_3D',
      ScalarOperateNode: 'file_3D',
      ShadowOnlyMaterialNode: 'shading_texture',
      JoystickNode: 'empty_single_arrow',
      NpcNavigateNode: 'tracking',
      ThirdPersonCameraNode: 'camera_data',
      BackgroundMusicNode: 'sound',
      PickableShapeNode: 'restrict_select_off',
      PictureNode: 'image_plane',
      LODNode: 'sort_size',
      FurNode: 'hair',
      ParticleSystemNode: 'lightprobe_grid',
      WaterNode: 'force_boid',
      MiniMapNode: 'pivot_cursor',
      Vector3OperateNode: 'con_translike',
      AnimatedTextureNode: 'render_animation',
      LerpNode: 'interpolate_linear',
      FunctionNode: 'con_transform',
      ShadowOnlyNode: 'shading_texture',
      CameraControllerNode: 'camera_data',
      CameraPlacementNode: 'con_camerasolver',
      LookAtTargetNode: 'file_3D',
      DataExpandNode: 'file_3D',
      JSONDataNode: 'file_3D',
      IntersectionNode: 'mod_physics',
      ConnectorNode: 'nodetree',
      ComponentInputNode: 'file_3D',
      ComponentOutputNode: 'file_3D',
      ComponentNode: 'file_3D',
      ThrottleNode: 'file_3D',
      MeshInstanceNode: 'file_3D',
      ArrayConcatNode: 'file_3D',
      BreakerNode: 'file_3D',
      DataSwitcherNode: 'file_3D',
      MovieClipNode: 'file_3D',
    };

    return _map[className] || 'file_3D';
  },
};