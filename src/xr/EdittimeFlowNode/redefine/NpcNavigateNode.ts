import { FlowNodeTypeRegistry, IFlowNodeTypeRegisterData } from 'ah-flow-node';
import { isEdittimeNode } from '../../IFlowNodeEdittimeData';
import { UtilityLayerRenderer, CreateSphere, Mesh, StandardMaterial, Color3 } from 'xr-impl-bjs/dist/bjs';

export const getNpcNavigateNodeRegisterData = (): IFlowNodeTypeRegisterData<'NpcNavigateNode'> => {
  const { define, setup } = FlowNodeTypeRegistry.Default.get('NpcNavigateNode')!;

  return {
    define,
    setup(ctx) {
      if (!isEdittimeNode(ctx)) throw new Error('is not edittime node: ' + ctx.ID);

      const dispose = setup(ctx);

      let layer: UtilityLayerRenderer | undefined;
      let ellipsoidMesh: Mesh | undefined;

      function refresh() {
        const { ellipsoid, ellipsoidOffset } = ctx.input;
        const { position } = ctx.output;

        if (!ellipsoid || !position) return;

        if (!layer) layer = new UtilityLayerRenderer(ctx.host, false);

        if (!ellipsoidMesh) {
          ellipsoidMesh = CreateSphere('ellipsoid_' + ctx.ID, { diameter: 1, segments: 6 }, layer.utilityLayerScene);

          ellipsoidMesh.isPickable = false;
          ellipsoidMesh.receiveShadows = false;

          const _mat = new StandardMaterial('ellipsoid', layer.utilityLayerScene);
          _mat.emissiveColor = Color3.White();
          _mat.wireframe = true;

          ellipsoidMesh.material = _mat;
        }

        ellipsoidMesh.position.copyFromFloats(position.x, position.y, position.z);
        if (ellipsoidOffset) {
          ellipsoidMesh.position.addInPlaceFromFloats(ellipsoidOffset.x, ellipsoidOffset.y, ellipsoidOffset.z);
        }

        ellipsoidMesh.scaling.copyFromFloats(ellipsoid.x * 2, ellipsoid.y * 2, ellipsoid.z * 2);
      }

      const removeTickListen = ctx.host.event.listen('beforeRender', refresh);
      refresh();

      return () => {
        layer?.dispose();
        ellipsoidMesh?.dispose(false, true);

        removeTickListen();
        dispose();
      };
    },
  };
};
