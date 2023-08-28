import { FlowNodeTypeRegistry, IFlowDTKey, IFlowNodeInput, IFlowNodeTypeRegisterData } from 'ah-flow-node';
import { isEdittimeNode } from '../../IFlowNodeEdittimeData';
import _ from 'lodash';

export const getConnectorNodeRegisterData = (): IFlowNodeTypeRegisterData<'ConnectorNode'> => {
  const { define, setup } = FlowNodeTypeRegistry.Default.get('ConnectorNode')!;

  return {
    define,
    setup(ctx) {
      if (!isEdittimeNode(ctx)) throw new Error('is not edittime node: ' + ctx.ID);

      const dispose = setup(ctx);

      // 载入节点选项
      function reloadAll() {
        const options: { label: string; value: string }[] = [];

        for (const node of ctx.host.flowNodeManager.all) {
          options.push({ label: node.name, value: node.ID });
        }

        ctx.updateDefine({
          input: {
            ...ctx._define.input,
            nodeID: { title: '节点', dataType: 'String', options },
          },
        });

        reloadConnectKeyOptions();
      }

      function reloadConnectKeyOptions() {
        const options: { label: string; value: string }[] = [];

        const node = ctx.input.nodeID ? ctx.host.flowNodeManager.get(ctx.input.nodeID) : undefined;
        if (node) {
          for (const [outKey, outDef] of Object.entries(node._define.output)) {
            options.push({ label: outDef.title ? `${outDef.title}(${outKey})` : outKey, value: outKey });
          }
        }

        ctx.updateDefine({
          input: {
            ...ctx._define.input,
            outputKey: { title: '端口', dataType: 'String', options },
          },
        });
      }

      ctx.event.listen('input:change', reloadAll);

      const remove1 = ctx.host.event.listen('afterNodeAdd', reloadAll);
      const remove2 = ctx.host.event.listen('afterNodeRemove', reloadAll);

      const remove3 = ctx.host.event.listen('node:define:change', ev => {
        if (ev.source.ID === ctx.input.nodeID) reloadConnectKeyOptions();
      });

      reloadAll();

      return () => {
        remove1();
        remove2();
        remove3();

        dispose();
      };
    },
  };
};
