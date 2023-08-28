import { FlowNodeTypeRegistry, IFlowNodeTypeRegisterData } from 'ah-flow-node';
import { isEdittimeNode } from '../../IFlowNodeEdittimeData';
import {
  Color3,
  CreateBox,
  CreateCylinder,
  CreateSphere,
  Mesh,
  PBRMaterial,
  StandardMaterial,
  Tags,
  Vector3,
} from 'xr-impl-bjs/dist/bjs';

export const getIntersectionNodeRegisterData = (): IFlowNodeTypeRegisterData<'IntersectionNode'> => {
  const { define, setup } = FlowNodeTypeRegistry.Default.get('IntersectionNode')!;

  return {
    define,
    setup(_ctx) {
      if (!isEdittimeNode(_ctx)) throw new Error('is not edittime node: ' + _ctx.ID);

      const ctx = _ctx; // type cast
      const dispose = setup(ctx);

      let indicatorMesh: Mesh | undefined;

      const mat = new StandardMaterial('IntersectionNodeMat', ctx.host);
      mat.wireframe = true;
      mat.emissiveColor = Color3.Red();

      function handleTick() {
        const { boundType, position, rotation, size } = ctx.input;

        if (boundType && position && size) {
          if (boundType === 'Cube') {
            if (indicatorMesh && !Tags.MatchesQuery(indicatorMesh, 'boundType:Cube')) {
              indicatorMesh.dispose();
              indicatorMesh = undefined;
            }

            if (!indicatorMesh) {
              indicatorMesh = CreateBox('Cube', { size: 1 }, ctx.host);
              indicatorMesh.material = mat;
              Tags.AddTagsTo(indicatorMesh, 'boundType:Cube');
            }
          }
          // Sphere
          else if (boundType === 'Sphere') {
            if (indicatorMesh && !Tags.MatchesQuery(indicatorMesh, 'boundType:Sphere')) {
              indicatorMesh.dispose();
              indicatorMesh = undefined;
            }

            if (!indicatorMesh) {
              indicatorMesh = CreateSphere('Sphere', { diameter: 1, segments: 12 }, ctx.host);
              indicatorMesh.material = mat;
              Tags.AddTagsTo(indicatorMesh, 'boundType:Sphere');
            }
          }
          // Cylinder
          else if (boundType === 'Cylinder') {
            if (indicatorMesh && !Tags.MatchesQuery(indicatorMesh, 'boundType:Cylinder')) {
              indicatorMesh.dispose();
              indicatorMesh = undefined;
            }

            if (!indicatorMesh) {
              indicatorMesh = CreateCylinder('Cylinder', { diameter: 1, height: 1, tessellation: 12 }, ctx.host);
              indicatorMesh.material = mat;
              Tags.AddTagsTo(indicatorMesh, 'boundType:Cylinder');
            }
          }
          //
          else {
            if (indicatorMesh) {
              indicatorMesh.dispose();
              indicatorMesh = undefined;
            }
          }

          if (indicatorMesh) {
            indicatorMesh.isPickable = false;
            indicatorMesh.position.set(position.x, position.y, position.z);
            indicatorMesh.scaling.set(size.x, size.y, size.z);

            if (rotation) indicatorMesh.rotation = Vector3.FromArray(rotation.scale(Math.PI / 180).asArray());

            const { gizmoVisible = false, gizmoVisible_volume = false } = ctx.host._edittime.sceneModel.gizmoState;

            indicatorMesh.isVisible = gizmoVisible && gizmoVisible_volume;
          }
        }
      }

      const removeTickListen = ctx.host.event.listen('beforeRender', handleTick);
      handleTick();

      return () => {
        if (indicatorMesh) indicatorMesh.dispose();
        mat.dispose();

        removeTickListen();
        dispose();
        mat.dispose();
      };
    },
  };
};
