import { IDefaultFlowNode, IFlowNodeClassNames, IFlowNodeFromMeta, IFlowNodeTypeRegisterData } from 'ah-flow-node';
import { UtilityLayerRenderer, TransformNode, PositionGizmo } from 'xr-impl-bjs/dist/bjs';
import * as core from 'xr-core';
import { isEdittimeNode } from '../../../IFlowNodeEdittimeData';

export function moveable<C extends IFlowNodeClassNames>(
  source: IFlowNodeTypeRegisterData<C>
): IFlowNodeTypeRegisterData<C> {
  return {
    ...source,
    setup(_ctx) {
      // type guard
      if (!isEdittimeNode(_ctx)) throw new Error('is not edittime node: ' + _ctx.ID);

      const ctx = _ctx;
      const dispose = source.setup(ctx as any);

      function checkIsSelect() {
        return ctx.input.__edittimeData?.selected;
      }

      let uLayer: UtilityLayerRenderer | undefined;
      let gizNode: TransformNode | undefined;
      let posGiz: PositionGizmo | undefined;
      let removeListenNodePosChange: Function | undefined;
      let isGizDragging = false;

      function disableGizmoAll() {
        if (removeListenNodePosChange) {
          removeListenNodePosChange();
          removeListenNodePosChange = undefined;
        }

        if (posGiz) {
          posGiz.dispose();
          posGiz = undefined;
        }

        if (gizNode) {
          gizNode.dispose();
          gizNode = undefined;
        }

        if (uLayer) {
          uLayer.dispose();
          uLayer = undefined;
        }
      }

      function reload() {
        const gizOriginIoKey = Object.keys(ctx._define.input).find(k => {
          const v = ctx.getInput(k as any);
          if (!v) return;

          return v.isPositionGizmoOrigin && v.dataType === 'Vector3';
        });

        if (!gizOriginIoKey) return disableGizmoAll();

        const gizOriginPos = ctx.getInput(gizOriginIoKey as any) as core.Vector3 | undefined;
        if (!gizOriginPos) return disableGizmoAll();

        const isSelect = checkIsSelect();
        if (!isSelect) return disableGizmoAll();

        if (!uLayer) uLayer = new UtilityLayerRenderer(ctx.host);

        const { gizmoVisible = false, gizmoVisible_transformGizmo = false } = ctx.host._edittime.sceneModel.gizmoState;

        // 响应全局 gizmo 显示隐藏
        uLayer.shouldRender = gizmoVisible && gizmoVisible_transformGizmo;

        if (!gizNode) {
          gizNode = new TransformNode('gizmo_' + ctx.ID, uLayer.utilityLayerScene);

          // bind transform node
          gizNode.position.set(gizOriginPos.x, gizOriginPos.y, gizOriginPos.z);
        }

        if (!posGiz) {
          posGiz = new PositionGizmo(uLayer, 1);
          posGiz.attachedNode = gizNode;

          posGiz.onDragStartObservable.add(() => (isGizDragging = true));
          posGiz.onDragEndObservable.add(() => (isGizDragging = false));
        }

        if (isGizDragging) {
          ctx.setInput(gizOriginIoKey as any, core.Vector3.FromArray(gizNode.position.asArray()));
        } else {
          gizNode.position.set(gizOriginPos.x, gizOriginPos.y, gizOriginPos.z);
        }
      }

      const removeTickListen = ctx.host.event.listen('beforeRender', reload);
      reload();

      return () => {
        removeTickListen();
        disableGizmoAll();
        dispose();
      };
    },
  };
}
