import React, { useContext } from 'react';
import { BizIcon, IBizIconName } from '../BizIcon';
import { AppstoreOutlined } from '@ant-design/icons';
import { IWBLayoutComponent } from './IWBLayout';
import { FWContext } from './FWContext';

export interface IComponentIconProps {
  className?: string;
  style?: React.CSSProperties;

  layout?: IWBLayoutComponent;
}

export const ComponentIcon = ({ className, style, layout, ...props }: IComponentIconProps) => {
  const ctx = useContext(FWContext);
  const curIcon = ctx.renderIcon?.(layout || ctx.currentLayout);

  return (
    <>
      {curIcon ? (
        typeof curIcon === 'string' ? (
          <BizIcon
            {...props}
            name={curIcon as IBizIconName}
            className={className}
            style={{ cursor: 'pointer', ...style }}
          />
        ) : (
          curIcon
        )
      ) : (
        <AppstoreOutlined {...props} className={className} style={{ cursor: 'pointer', ...style }} />
      )}
    </>
  );
};
