import { IFlowNodeClassNames, IFlowNodeInput, IFlowNodeTypeRegisterData } from 'ah-flow-node';
import { DefaultBizLogger } from '../../../../common';
import { isEdittimeNode } from '../../../IFlowNodeEdittimeData';
import { AxisDragGizmo, Color3, StandardMaterial, TransformNode, Vector3 } from 'xr-impl-bjs/dist/bjs';
import { IVector3Like } from 'xr-core';

export function locationIndicator<C extends IFlowNodeClassNames>(
  source: IFlowNodeTypeRegisterData<C>,
  origin: string,
  indicator: 'arrow',
  opt: { color?: string; lookAtTarget?: string } = {}
): IFlowNodeTypeRegisterData<C> {
  const inputDefine: Record<string, IFlowNodeInput<'Vector3'>> = source.define.input as any;

  if (inputDefine[origin] && inputDefine[origin].dataType === 'Vector3') {
    DefaultBizLogger.info('[LocationIndicator] wrap %s', source.define.className);

    return {
      ...source,
      setup(_ctx) {
        if (!isEdittimeNode(_ctx)) throw new Error('is not edittime node: ' + _ctx.ID);

        const ctx = _ctx; // type guard
        const dispose = source.setup(ctx);

        const _mat = new StandardMaterial('indicator_mat_' + ctx.ID, ctx.host);
        _mat.disableLighting = true;
        _mat.emissiveColor = opt.color ? Color3.FromHexString(opt.color) : Color3.Yellow();

        let indicatorNode: TransformNode | undefined;

        // 刷新指示器
        function updateIndicator() {
          const position = (ctx.input as any)[origin] as IVector3Like;
          if (!position) return;

          if (indicator === 'arrow') {
            if (!indicatorNode) indicatorNode = AxisDragGizmo._CreateArrow(ctx.host, _mat, 2);

            indicatorNode.position.set(position.x, position.y, position.z);
          }

          // 响应全局 gizmo 显示隐藏
          if (indicatorNode) {
            const { gizmoVisible = false, gizmoVisible_locationIndicator = false } =
              ctx.host._edittime.sceneModel.gizmoState;

            indicatorNode.setEnabled(gizmoVisible && gizmoVisible_locationIndicator);
          }

          if (
            indicatorNode &&
            opt.lookAtTarget &&
            inputDefine[opt.lookAtTarget]?.dataType === 'Vector3' &&
            (ctx.input as any)[opt.lookAtTarget]
          ) {
            const target = (ctx.input as any)[opt.lookAtTarget] as IVector3Like;

            const dx = target.x - position.x;
            const dy = target.y - position.y;
            const dz = target.z - position.z;
            const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

            indicatorNode.scaling.setAll(length);
            indicatorNode.lookAt(new Vector3(target.x, target.y, target.z));
          }
        }

        ctx.event.listen(`input:change:${origin}` as any, updateIndicator);

        if (opt.lookAtTarget) {
          ctx.event.listen(`input:change:${opt.lookAtTarget}` as any, updateIndicator);
        }

        const removeGizListen = ctx.host._edittime.sceneModel.event.listen('afterGizmoStateChange', updateIndicator);

        updateIndicator();

        return () => {
          dispose();
          removeGizListen();

          _mat.dispose();
          if (indicatorNode) indicatorNode.dispose();
        };
      },
    };
  }

  return source;
}
