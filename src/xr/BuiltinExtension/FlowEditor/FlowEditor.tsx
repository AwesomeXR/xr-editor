import React, { useContext, useLayoutEffect, useRef } from 'react';
import { XREditorContext } from '../../XREditorContext';
import { useListen } from '../../../common/hook/useListen';
import { useFWHeaderSlot } from '../../../common/component/FlexibleWorkbench';
import cx from 'classnames';
import { FloatBizMenu, useForceUpdate } from '../../../common';
import { BizXRPanelMenuBar } from '../../component/BizXRPanelMenuBar';
import { usePanelModel } from '../../hook/usePanelModel';
import { FlowEditorModel } from './FlowEditorModel';
import { SplitView } from '../../../common/component/SplitView';
import { PropertyPanel } from './PropertyPanel';

export interface IFlowEditorProps {
  className?: string;
  style?: React.CSSProperties;
}

export const FlowEditor = ({ className, style }: IFlowEditorProps) => {
  const ctx = useContext(XREditorContext);
  const headerSlot = useFWHeaderSlot();

  const ref = useRef<HTMLDivElement>(null);

  const model = usePanelModel<FlowEditorModel>('FlowEditor');
  const fu = useForceUpdate();

  useListen(ctx.project.event, 'scene:afterActiveFlowHocGroupIDChange', fu.update);
  useListen(model.event, 'afterStateChange', fu.update);

  useLayoutEffect(() => {
    if (ref.current) {
      model.launch(ref.current);
      return () => model.dispose();
    }
  }, []);

  const renderHeader = () => {
    return headerSlot(<BizXRPanelMenuBar />);
  };

  return (
    <div
      data-name='FlowEditor'
      className={cx('FlowEditor', className)}
      style={{ position: 'relative', height: '100%', width: '100%', ...style }}
    >
      {renderHeader()}

      <SplitView
        right={<PropertyPanel model={model} />}
        rightSize={model.state.propertyPanelSize}
        onRightSizeChange={size => model.updateState({ propertyPanelSize: size })}
      >
        <div
          key='x6'
          ref={ref}
          style={{ height: '100%', overflow: 'hidden' }}
          onMouseMove={ev => {
            model.mousePos = { x: ev.clientX, y: ev.clientY };
          }}
        />
      </SplitView>

      {model.state.contextMenuData && (
        <FloatBizMenu
          visible
          onCheckEnabled={ctx.command.isEnabled as any}
          onCommand={ctx.command.execute as any}
          cursor={model.state.contextMenuData.cursor}
          items={model.state.contextMenuData.items}
          onClose={() => model.updateState({ contextMenuData: undefined })}
        />
      )}
    </div>
  );
};
