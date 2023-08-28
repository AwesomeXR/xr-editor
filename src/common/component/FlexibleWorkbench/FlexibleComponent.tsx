import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { FWContext } from './FWContext';
import { Button, Space, Typography } from 'antd';
import { CloseOutlined, VerticalLeftOutlined } from '@ant-design/icons';
import { ErrorBoundary } from '../ErrorBoundary';
import { WBUtil } from './WBUtil';
import { SwitchComponentTrigger } from './SwitchComponentTrigger';
import { ComponentIcon } from './ComponentIcon';

export interface IFlexibleComponentProps {
  className?: string;
  style?: React.CSSProperties;
}

const NotFoundComponent = () => (
  <Typography.Text type='secondary' style={{ display: 'block', padding: 4 }}>
    面板未定义
  </Typography.Text>
);

export const FlexibleComponent = ({ className, style }: IFlexibleComponentProps) => {
  const ctx = useContext(FWContext);
  const ref = useRef<HTMLDivElement>(null);
  const [domReady, setDomReady] = useState<boolean>();

  useLayoutEffect(() => {
    setDomReady(true);
  }, []);

  const layout = ctx.currentLayout;
  if (layout.type !== 'Component') return null;

  const InnerComponent = ctx.components[layout.component] || NotFoundComponent;

  const isSingleComponent = ctx.config.layout.type === 'Component';
  const _hideHeaderWidget =
    ctx.config.hideHeaderWidget || (isSingleComponent && ctx.config.hideHeaderWhenSingleComponent);

  const renderHeader = () => {
    // useFWHeaderSlot() 依赖这个 div
    const _slotEle = <div id={'FW-internal-slot-' + layout.key} className={cx('internal-slot')} />;

    if (_hideHeaderWidget) {
      return (
        <div className={cx('header')}>
          <div className='title'>
            <ComponentIcon layout={layout} style={{ marginRight: 8 }} />
            <div className='main'>{ctx.renderTitle(layout)}</div>
            {_slotEle}
          </div>
        </div>
      );
    }

    return (
      <div className='header'>
        <div className='title'>
          <SwitchComponentTrigger layout={layout} style={{ marginRight: 8 }} />
          <div className='main'>{ctx.renderTitle(layout)}</div>
          {_slotEle}
        </div>

        <Space.Compact className='extra' size='small'>
          <Button
            title='向右切分'
            type='text'
            icon={<VerticalLeftOutlined />}
            onClick={() => {
              WBUtil.splitPanel(layout, 'horizontal');
              ctx.event.emit('afterConfigChange', { source: layout });
            }}
          />
          <Button
            title='向下切分'
            type='text'
            icon={<VerticalLeftOutlined style={{ transform: 'rotate(90deg)' }} />}
            onClick={() => {
              WBUtil.splitPanel(layout, 'vertical');
              ctx.event.emit('afterConfigChange', { source: layout });
            }}
          />
          <Button
            title='关闭'
            type='text'
            icon={<CloseOutlined />}
            onClick={() => {
              WBUtil.closePanel(ctx.config, layout.key);
              ctx.event.emit('afterConfigChange', { source: layout });
            }}
          />
        </Space.Compact>
      </div>
    );
  };

  return (
    <div
      ref={ref}
      className={cx('FW-component', className)}
      onMouseEnter={() => {
        ctx.event.emit('afterEnterPanel', { item: layout });
      }}
      style={style}
    >
      {renderHeader()}
      <div id={`FW-component-body-${layout.key}`} className='body'>
        <ErrorBoundary key={layout.component}>{domReady && <InnerComponent />}</ErrorBoundary>
      </div>
    </div>
  );
};
