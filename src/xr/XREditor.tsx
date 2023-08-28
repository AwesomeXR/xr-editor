import React, { useRef, useLayoutEffect } from 'react';
import './style.less';
import { ConfigProvider, Spin, message, theme } from 'antd';
import AntdZhCnLocal from 'antd/locale/zh_CN';
import cx from 'classnames';
import { useListen } from '../common/hook/useListen';
import { useForceUpdate } from '../common/hook/useForceUpdate';
import { WorkbenchHeader } from './component/WorkbenchHeader';
import { ISlotRenderer, IXREditorEvent, XREditorContext } from './XREditorContext';
import { XRProjectModel } from './ViewModel/XRProjectModel';
import { EventBus } from 'ah-event-bus';
import { HotkeySystem } from './HotkeySystem';
import { FlexibleWorkbench } from '../common/component/FlexibleWorkbench';
import { WorkbenchStatusBar } from './component/WorkbenchStatusBar';
import ThemeToken from '../ThemeToken.json';
import { Deferred } from 'xr-core';
import { PromptLayer } from './PromptLayer';
import { WorkbenchFileDropLayer } from './component/WorkbenchFileDropLayer';
import { IBuiltinWBKeyItem } from './ViewModel';
import { LoadingOutlined } from '@ant-design/icons';
import { XRExtensionRegistry } from './XRExtensionRegistry';

export interface IXREditorFeatureConfig {
  // 仅允许的工作区
  allowedWorkbench?: IBuiltinWBKeyItem[];
}

export interface IXREditorProps {
  className?: string;
  style?: React.CSSProperties;

  project: XRProjectModel;
  slotRenderer?: ISlotRenderer;

  feature?: IXREditorFeatureConfig;
}

Spin.setDefaultIndicator(<LoadingOutlined style={{ fontSize: 24 }} spin />);

export const XREditor = ({ className, style, project, slotRenderer, feature = {} }: IXREditorProps) => {
  const fu = useForceUpdate();
  const hotkeyRef = useRef(new HotkeySystem(project, project.command));
  const eventRef = useRef(new EventBus<IXREditorEvent>());

  const [api, contextHolder] = message.useMessage();

  useListen(project.workbench.event, 'wbConfigChange', fu.update);

  useListen(project.event, 'beforeSave', () => api.loading({ content: '保存中', key: 'glSave' }));
  useListen(project.event, 'afterSave', () => api.success({ content: '已保存', key: 'glSave' }));

  useLayoutEffect(() => {
    project.command.event.listen('execute:afterError', ev => {
      message.error(ev.err + '');
    });
    hotkeyRef.current.bind();

    return () => {
      hotkeyRef.current.unbind();
    };
  }, []);

  return (
    <ConfigProvider
      locale={AntdZhCnLocal}
      autoInsertSpaceInButton={false}
      theme={{
        token: ThemeToken,
        components: {
          Descriptions: { padding: 8, paddingXS: 4 },
          // 按 Switch 配色修正 Slider
          Slider: {
            colorPrimaryBorder: ThemeToken.colorPrimary,
            colorPrimaryBorderHover: ThemeToken.colorPrimaryHover,
          },
          Segmented: {
            itemSelectedBg: ThemeToken.colorPrimary,
            colorText: '#fff',
          },
          Tabs: {
            verticalItemPadding: '4px 24px 4px 0px',
          },
        },
      }}
    >
      <XREditorContext.Provider
        value={{
          event: eventRef.current,
          project,
          command: project.command,
          slotRenderer,
          feature,
          prompt: (title, schema, defaultValue) => {
            const defer = new Deferred<any>();

            const _remove = eventRef.current.listen('promptResponse', ev => defer.resolve(ev.value));
            defer.ret.finally(_remove);

            eventRef.current.emit('promptQuery', { title, schema, defaultValue });
            return defer.ret;
          },
        }}
      >
        <FlexibleWorkbench
          key={project.workbench.wbConfigIdx}
          className={cx('XREditor', className)}
          renderHeader={() => <WorkbenchHeader style={{ height: '100%' }} />}
          renderStatusBar={() => <WorkbenchStatusBar />}
          config={project.workbench.wbConfig}
          components={XRExtensionRegistry.Default.componentViewMap}
          renderTitle={layout => {
            return layout.type === 'Component'
              ? XRExtensionRegistry.Default.getPanelTitle(layout.component) || layout.component
              : layout.key;
          }}
          renderIcon={layout =>
            layout.type === 'Component' ? XRExtensionRegistry.Default.getPanel(layout.component)?.icon : undefined
          }
          onConfigChange={(config, skipRefresh) => project.workbench.setWbConfig(config, { silence: skipRefresh })}
          onEnterPanel={layout => project.workbench.setScope({ comp: layout.component, ID: layout.key })}
          style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}
        />

        {contextHolder}

        <PromptLayer />
        <WorkbenchFileDropLayer />
      </XREditorContext.Provider>
    </ConfigProvider>
  );
};
