import { FlowNodeTypeRegistry, IFlowNodeTypeRegisterData } from 'ah-flow-node';
import { isEdittimeNode } from '../../IFlowNodeEdittimeData';
import { Mesh, PBRMaterial } from 'xr-impl-bjs/dist/bjs';

export const getPickableShapeNodeRegisterData = (): IFlowNodeTypeRegisterData<'PickableShapeNode'> => {
  const { define, setup } = FlowNodeTypeRegistry.Default.get('PickableShapeNode')!;

  return {
    define,
    setup(ctx) {
      if (!isEdittimeNode(ctx)) throw new Error('is not edittime node: ' + ctx.ID);

      const dispose = setup(ctx);

      const mat = new PBRMaterial('PickableShapeMat', ctx.host);
      mat.wireframe = true;

      function bindMesh() {
        if (!ctx.output.mesh) return;

        const mesh = ctx.output.mesh as Mesh;
        mesh.visibility = 1;
        mesh.material = mat;
        mesh.isPickable = false;
      }

      ctx.event.listen('output:change:mesh', bindMesh);
      bindMesh();

      return () => {
        dispose();
        mat.dispose();
      };
    },
  };
};
