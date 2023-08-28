import React, { useContext } from 'react';
import { XREditorContext } from '../XREditorContext';
import { MarkdownRender } from '../../common/component/MarkdownRender/MarkdownRender';

export interface IDocRenderProps {
  className?: string;
  style?: React.CSSProperties;
}

export const DocRender = ({ className, style }: IDocRenderProps) => {
  const ctx = useContext(XREditorContext);
  return null;
};
