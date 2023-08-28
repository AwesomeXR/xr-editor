import React from 'react';

export interface ISceneScriptPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

export const SceneScriptPanel = ({ className, style }: ISceneScriptPanelProps) => {
  return (
    <div data-name='SceneScriptPanel' className={className} style={style}>
      SceneScriptPanel
    </div>
  );
};
