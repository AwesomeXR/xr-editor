import React from 'react';
import { IBizIconName, IBizIconNameAntd } from './type';
import Icon, { AppstoreAddOutlined, DeliveredProcedureOutlined, PlusSquareOutlined } from '@ant-design/icons';
import cx from 'classnames';
import { theme } from 'antd';
import './style.less';

export interface IBizIconProps {
  className?: string;
  style?: React.CSSProperties;
  name: IBizIconName;
  status?: 'default' | 'active' | 'mute';

  onTap?: () => any;
}

const rc = (require as any).context('./blender-icons', false, /.svg$/);
const loadedModules = (rc.keys() as string[]).map(key => {
  const name = key.replace('./', '').replace('.svg', '');
  const exported = rc(key);

  return { name, Comp: exported.default };
});

const BlenderModuleMap = new Map<IBizIconName, React.FC<any>>(
  loadedModules.map(d => {
    const name = d.name as IBizIconName;

    if (name === 'checkbox_dehlt' || name === 'checkbox_hlt' || name === 'checkmark') {
      return [d.name, (props: any) => <d.Comp viewBox='3 3 14 14' {...props} />] as any;
    }

    return [d.name, (props: any) => <d.Comp viewBox='2 2 17 17' {...props} />] as any;
  })
);

const AntdIconMap: Record<IBizIconNameAntd, React.FC<any>> = {
  'antd:AppstoreAddOutlined': (props: any) => <AppstoreAddOutlined {...props} />,
  'antd:PlusSquareOutlined': (props: any) => <PlusSquareOutlined {...props} />,
  'antd:DeliveredProcedureOutlined': (props: any) => <DeliveredProcedureOutlined {...props} />,
};

export const BizIcon = ({ name, status = 'default', onTap, ...props }: IBizIconProps) => {
  const { token } = theme.useToken();

  const iconProps = {
    ...props,
    className: cx(props.className, 'BizIcon', status, { link: onTap }),
    style: {
      '--color-primary': token.colorPrimary,
      '--color-disabled': token.colorTextDisabled,
      ...props.style,
    },
    onMouseDown: onTap,
  };

  const DirectIcon: React.FC<any> | undefined = (AntdIconMap as any)[name];
  if (DirectIcon) return <DirectIcon {...iconProps} />;

  const BlenderIcon = BlenderModuleMap.get(name);
  if (!BlenderIcon) return null;

  return <Icon component={BlenderIcon} {...iconProps} />;
};
