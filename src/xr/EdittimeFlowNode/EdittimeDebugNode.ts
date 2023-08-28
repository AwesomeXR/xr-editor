import { BaseInput } from 'xr-core';
import { IFlowNodeMeta, IFlowNodeTypeRegisterData } from 'ah-flow-node';

declare module 'ah-flow-node' {
  interface IFlowNodeMetaMap {
    EdittimeDebugNode: IFlowNodeMeta<'EdittimeDebugNode', { msg: 'Message' } & BaseInput, {}>;
  }
}

export const EdittimeDebugNodeRegisterData: IFlowNodeTypeRegisterData<'EdittimeDebugNode'> = {
  define: {
    className: 'EdittimeDebugNode',
    cnName: '调试',
    input: { msg: { dataType: 'Message' }, ...BaseInput },
    output: {},
  },
  setup(ctx) {
    const doLog = new Function('id', 'arg', 'console.log(id, arg);');

    ctx.event.listen('input:change:msg', ev => {
      doLog(ctx.name, { from: ev.lastValue, to: ev.value });
    });

    return () => {};
  },
};
