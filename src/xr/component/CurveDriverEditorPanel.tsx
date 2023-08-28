import React, { useContext, useEffect, useState } from 'react';
import { useFWHeaderSlot, useFWPanelSize, useFWQuery } from '../../common';
import { CurveDriverEditor } from './CurveDriverEditor';
import { IFlowNode, Util } from 'ah-flow-node';
import { Divider, Empty, Row } from 'antd';
import { XREditorContext } from '../XREditorContext';
import { BizXRMenuBar } from './BizXRMenuBar';

export interface ICurveDriverEditorPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

type IPanelQuery = { nodeID?: string };

export const CurveDriverEditorPanel = ({ className, style }: ICurveDriverEditorPanelProps) => {
  const ctx = useContext(XREditorContext);
  const panelSize = useFWPanelSize();
  const headerSlot = useFWHeaderSlot();
  const { query, mergeQuery } = useFWQuery<IPanelQuery, string>();

  const [targetNode, setTargetNode] = useState<IFlowNode<'CurveDriverNode'>>();

  useEffect(() => {
    if (query?.nodeID) {
      handleSetTargetNodeByID(query.nodeID);
    }
  }, [query?.nodeID]);

  const handleSetTargetNodeByID = (ID: string) => {
    const _targetNode = ctx.project.activeScene?.rootFlowHost?.flowNodeManager.get(ID, 'CurveDriverNode');
    setTargetNode(_targetNode);
    mergeQuery({ nodeID: ID });
  };

  const renderHeader = (extra: any) => {
    return headerSlot(
      <Row align='middle' style={{ width: 'fit-content' }}>
        <BizXRMenuBar
          external={{
            __select: {
              execute: (ID: string) => handleSetTargetNodeByID(ID),
            },
          }}
          datasource={[
            {
              title: '节点',
              items:
                ctx.project.activeScene?.rootFlowHost?.flowNodeManager.all
                  .filter(n => Util.isFlowNode('CurveDriverNode', n))
                  .map(n => ({
                    command: '__select',
                    arg: n.ID,
                    title: n.name,
                    icon: targetNode?.ID === n.ID ? 'checkmark' : undefined,
                  })) || [],
            },
          ]}
        />
        <Divider type='vertical' />
        {extra}
      </Row>
    );
  };

  console.log('@@@', 'panelSize ->', panelSize);

  return (
    <div data-name='CurveDriverEditorPanel' className={className} style={{ height: '100%', ...style }}>
      {targetNode ? (
        <CurveDriverEditor
          width={panelSize.width}
          height={panelSize.height}
          target={targetNode}
          headerSlot={renderHeader}
        />
      ) : (
        <>
          {renderHeader(null)}
          <div style={{ overflow: 'hidden' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        </>
      )}
    </div>
  );
};
