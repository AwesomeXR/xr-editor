import { Dropdown, Space } from 'antd';
import React, { useContext } from 'react';
import { FWContext } from './FWContext';
import { AppstoreOutlined, BorderOutlined } from '@ant-design/icons';
import { WBUtil } from './WBUtil';
import { IWBLayoutComponent } from './IWBLayout';
import { BizIcon, IBizIconName } from '../BizIcon';
import { ComponentIcon } from './ComponentIcon';

export interface IPanelTitleProps<C extends string> {
  className?: string;
  style?: React.CSSProperties;

  layout: IWBLayoutComponent;
}

export const SwitchComponentTrigger = <C extends string>({ className, style, layout }: IPanelTitleProps<C>) => {
  const ctx = useContext(FWContext);

  return (
    <Dropdown
      key={layout.key}
      menu={{
        style: { minWidth: 96 },
        items: Object.entries(ctx.components).map(([compKey]) => {
          const targetLayout = WBUtil.createComponent(compKey as C);
          const icon = ctx.renderIcon?.(targetLayout as any);

          return {
            key: compKey,
            icon: typeof icon === 'string' ? <BizIcon name={icon as IBizIconName} /> : icon,
            label: ctx.renderTitle(targetLayout as any),
            disabled: layout.component === compKey,
            onClick: () => {
              WBUtil.resetLayout(layout, targetLayout);
              ctx.event.emit('afterConfigChange', { source: layout });
            },
          };
        }),
      }}
    >
      <ComponentIcon className={className} style={style} layout={layout} />
    </Dropdown>
  );
};
