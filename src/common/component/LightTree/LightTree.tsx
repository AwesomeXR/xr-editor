import { Empty, theme } from 'antd';
import _ from 'lodash';
import React from 'react';
import { LightTreeNode } from './LightTreeNode';
import cx from 'classnames';
import { TreeModel } from './TreeModel';
import { useForceUpdate, useListen } from '../../hook';
import './style.less';

export interface ILightTreeProps {
  className?: string;
  style?: React.CSSProperties;
  model: TreeModel;
}

export const LightTree = ({ className, style, model }: ILightTreeProps) => {
  const { token } = theme.useToken();
  const fu = useForceUpdate();

  useListen(model.event, '__nodesForRenderChange', fu.update);

  return (
    <>
      <div
        className={cx(className, 'LightTree')}
        style={
          {
            '--color-primary-bg': token.colorPrimary,
            '--color-primary-bg-hover': token.colorPrimaryBg,
            '--color-text-disabled': token.colorTextDisabled,
            ...style,
          } as any
        }
      >
        {model.nodesForRender.length > 0 ? (
          model.nodesForRender.map(({ node }) => {
            return <LightTreeNode key={node.id} id={node.id} model={model} />;
          })
        ) : (
          <Empty description='暂无数据' image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </>
  );
};
