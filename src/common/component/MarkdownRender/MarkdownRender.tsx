import React, { useMemo } from 'react';
import * as marked from 'marked';
import './style.less';
import cx from 'classnames';

marked.marked.setOptions({
  headerIds: false,
  mangle: false,
  highlight: null as any,
  langPrefix: '',
});

export interface IMarkdownRenderProps {
  className?: string;
  style?: React.CSSProperties;

  md: string;
}

export const MarkdownRender = ({ className, style, md }: IMarkdownRenderProps) => {
  const __html = useMemo(() => marked.marked(md), [md]);

  return (
    <div
      data-name='MarkdownRender'
      className={cx('markdown-body', className)}
      style={style}
      dangerouslySetInnerHTML={{ __html }}
    ></div>
  );
};
