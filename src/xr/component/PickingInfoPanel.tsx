import React, { useContext } from 'react';
import { XREditorContext } from '../XREditorContext';

export interface IPickingInfoPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

export const PickingInfoPanel = ({ className, style }: IPickingInfoPanelProps) => {
  const ctx = useContext(XREditorContext);
  return null;
};
