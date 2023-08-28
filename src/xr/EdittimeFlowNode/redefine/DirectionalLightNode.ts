import { FlowNodeTypeRegistry, IFlowNodeTypeRegisterData, Util } from 'ah-flow-node';
import { isEdittimeNode } from '../../IFlowNodeEdittimeData';
import {
  CreateDashedLines,
  DirectionalLightFrustumViewer,
  LightGizmo,
  LinesMesh,
  PBRMaterial,
  Tags,
  UtilityLayerRenderer,
  Vector3,
} from 'xr-impl-bjs/dist/bjs';

export const getDirectionalLightNodeRegisterData = (): IFlowNodeTypeRegisterData<'DirectionalLightNode'> => {
  const { define, setup } = FlowNodeTypeRegistry.Default.get('DirectionalLightNode')!;

  const newDefine = Util.cloneNodeDefine(define);
  newDefine.input.frustumViewerVisible = { dataType: 'Boolean', hiddenInGraph: true };

  return {
    define: newDefine as any,
    setup(_ctx) {
      if (!isEdittimeNode(_ctx)) throw new Error('is not edittime node: ' + _ctx.ID);

      const ctx = _ctx; // type cast
      const dispose = setup(ctx);

      let layer: UtilityLayerRenderer | undefined;
      let gizmo: LightGizmo | undefined;
      let lineMat: PBRMaterial | undefined;
      let line: LinesMesh | undefined;
      let viewer: DirectionalLightFrustumViewer | undefined;

      function refresh() {
        const { light, position } = ctx.output;
        const { target } = ctx.input;

        if (!light || !position || !target) return;

        if (!layer) layer = new UtilityLayerRenderer(ctx.host, false);

        const {
          gizmoVisible = false,
          gizmoVisible_lightIndicator = false,
          gizmoVisible_lightFrustum = false,
        } = ctx.host._edittime.sceneModel.gizmoState;

        // 响应全局 gizmo 显示隐藏
        layer.shouldRender = gizmoVisible && gizmoVisible_lightIndicator;

        if (!gizmo) {
          gizmo = new LightGizmo(layer);
          gizmo.light = light;
          gizmo.scaleRatio = 2;
        }

        if (!lineMat) lineMat = new PBRMaterial('line_mat_' + ctx.ID, ctx.host);

        const points = [new Vector3(position.x, position.y, position.z), new Vector3(target.x, target.y, target.z)];
        const lineTagValue = points.map(p => p.toString()).join(';');

        if (line && !Tags.MatchesQuery(line, lineTagValue)) {
          line.dispose();
          line = undefined;
        }

        if (!line) {
          line = CreateDashedLines(
            'lines_' + ctx.ID,
            { points, material: lineMat, dashSize: 1, gapSize: 1 },
            layer.utilityLayerScene
          );
          Tags.AddTagsTo(line, lineTagValue);

          line.isPickable = false;
          line.receiveShadows = false;
        }

        if (!viewer && ctx.host.activeCamera) {
          viewer = new DirectionalLightFrustumViewer(light, ctx.host.activeCamera);
        }

        if (viewer) {
          const frustumVisible =
            gizmoVisible && gizmoVisible_lightFrustum && ctx.input.shadow && (ctx.input as any).frustumViewerVisible;

          if (frustumVisible) viewer.show();
          else viewer.hide();

          viewer.update();
        }
      }

      const removeTickListen = ctx.host.event.listen('beforeRender', refresh);
      refresh();

      return () => {
        layer?.dispose();
        gizmo?.dispose();
        lineMat?.dispose();
        line?.dispose();
        viewer?.dispose();

        removeTickListen();
        dispose();
      };
    },
  };
};
