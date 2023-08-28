import { IFlowNodeClassNames, IFlowNodeInput, IFlowNodeTypeRegisterData } from 'ah-flow-node';
import { DefaultBizLogger } from '../../../../common';
import { isEdittimeNode } from '../../../IFlowNodeEdittimeData';
import { Color3, CreateDashedLines, LinesMesh, PBRMaterial, Vector3 } from 'xr-impl-bjs/dist/bjs';
import { IVector3Like } from 'xr-core';

export function relationLine<C extends IFlowNodeClassNames>(
  source: IFlowNodeTypeRegisterData<C>,
  rayOrigin: string,
  rayTarget: string,
  opt: { color?: string } = {}
): IFlowNodeTypeRegisterData<C> {
  const inputDefine: Record<string, IFlowNodeInput<'Vector3'>> = source.define.input as any;

  if (
    inputDefine[rayOrigin] &&
    inputDefine[rayOrigin].dataType === 'Vector3' &&
    inputDefine[rayTarget] &&
    inputDefine[rayTarget].dataType === 'Vector3'
  ) {
    DefaultBizLogger.info('[RelationLine] wrap %s', source.define.className);

    return {
      ...source,
      setup(_ctx) {
        if (!isEdittimeNode(_ctx)) throw new Error('is not edittime node: ' + _ctx.ID);

        const ctx = _ctx; // type guard
        const dispose = source.setup(ctx);

        const lineMat = new PBRMaterial('line_mat_' + ctx.ID, ctx.host);
        lineMat.albedoColor = opt.color ? Color3.FromHexString(opt.color) : Color3.Yellow().scale(0.5);
        lineMat.unlit = true;
        lineMat.disableLighting = true;

        let line: LinesMesh | undefined;

        function updateLine() {
          if (line) {
            line.dispose();
            line = undefined;
          }

          const p1 = (ctx.input as any)[rayOrigin] as IVector3Like | undefined;
          const p2 = (ctx.input as any)[rayTarget] as IVector3Like | undefined;

          if (!p1 || !p2) return;

          line = CreateDashedLines(
            'lines_' + ctx.ID,
            {
              points: [new Vector3(p1.x, p1.y, p1.z), new Vector3(p2.x, p2.y, p2.z)],
              material: lineMat,
              dashSize: 1,
              gapSize: 1,
            },
            ctx.host
          );
          line.isPickable = false;
          line.receiveShadows = false;

          const { gizmoVisible = false, gizmoVisible_relationLine = false } = ctx.host._edittime.sceneModel.gizmoState;

          line.isVisible = gizmoVisible && gizmoVisible_relationLine;
        }

        ctx.event.listen(`input:change:${rayOrigin}` as any, updateLine);
        ctx.event.listen(`input:change:${rayTarget}` as any, updateLine);

        const removeGizListen = ctx.host._edittime.sceneModel.event.listen('afterGizmoStateChange', updateLine);

        updateLine();

        return () => {
          dispose();
          removeGizListen();

          lineMat.dispose();
          if (line) line.dispose();
        };
      },
    };
  }

  return source;
}
