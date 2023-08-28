import React, { useRef } from 'react';
import { IWBConfigData, IWBLayout, IWBLayoutComponent } from './IWBLayout';
import cx from 'classnames';
import './style.less';
import { FWContext, IFWContext, IFWEvt } from './FWContext';
import _ from 'lodash';
import { EventBus } from 'ah-event-bus';
import { FlexibleLayout } from './FlexibleLayout';
import { useForceUpdate } from '../../hook/useForceUpdate';
import { useListen } from '../../hook/useListen';
import { useHandler } from '../../hook/useHandler';
import { theme } from 'antd';
import { FlexibleSidePanelContainer } from './FlexibleSidePanelContainer';

export interface IFlexibleWorkbenchProps {
  className?: string;
  style?: React.CSSProperties;

  renderHeader: () => any;
  renderStatusBar: () => any;

  renderIcon?: (layout: IWBLayout) => any;
  renderTitle?: (layout: IWBLayout) => any;

  components: Record<string, any>;
  config: IWBConfigData;
  onConfigChange: (config: IWBConfigData, skipRefresh?: boolean) => any;
  onEnterPanel?: (layout: IWBLayoutComponent) => any;
}

const DefaultRenderTitle = (layout: IWBLayout) => {
  if (layout.type === 'Component') return layout.component;
  if (layout.type === 'Split') return layout.key;
  return '<Unknown>';
};

export const FlexibleWorkbench = ({
  className,
  style,
  config,
  onConfigChange,
  renderHeader,
  renderStatusBar,
  renderIcon,
  components,
  renderTitle = DefaultRenderTitle,
  onEnterPanel = () => {},
}: IFlexibleWorkbenchProps) => {
  const eventRef = useRef(new EventBus<IFWEvt>());
  const { token } = theme.useToken();

  const fu = useForceUpdate();

  const handleConfigChange = useHandler(onConfigChange);
  const handleOverPanel = useHandler(onEnterPanel);

  useListen(eventRef.current, 'afterConfigChange', ev => {
    if (!ev.skipRefresh) {
      fu.update();
    }

    handleConfigChange({ ...config }, ev.skipRefresh);
  });

  useListen(eventRef.current, 'afterEnterPanel', ev => {
    handleOverPanel(ev.item);
  });

  const ctx: IFWContext = {
    components,
    config,
    event: eventRef.current,
    currentLayout: config.layout,
    renderTitle,
    renderIcon,
  };

  return (
    <div
      data-name='FlexibleWorkbench'
      className={cx('FW', className)}
      style={
        {
          '--colorBorderSecondary': token.colorBorderSecondary,
          ...style,
        } as any
      }
    >
      <div className='header'>{renderHeader()}</div>

      <div className={cx('body')}>
        <FWContext.Provider value={ctx}>
          <FlexibleSidePanelContainer className='side' />
          <FlexibleLayout className='split' />
        </FWContext.Provider>
      </div>

      <div className='footer'>
        <div className='leading'></div>
        <div className='statusbar'>{renderStatusBar()}</div>
      </div>
    </div>
  );
};
