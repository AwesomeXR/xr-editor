import React, { useContext } from 'react';
import { SceneModel } from '../ViewModel';
import { InlineCell } from '../../common';
import { BizField } from './BizField';
import { Button, message } from 'antd';
import { XREditorContext } from '../XREditorContext';
import { Util } from 'ah-flow-node';
import copy from 'copy-to-clipboard';
import { BizFlowNodeUtil } from '../lib';

export interface ISceneConfigPanelProps {
  className?: string;
  style?: React.CSSProperties;

  scene: SceneModel;
}

export const SceneConfigPanel = ({ className, style, scene }: ISceneConfigPanelProps) => {
  const ctx = useContext(XREditorContext);

  return (
    <div data-name='SceneConfigPanel' className={className} style={{ padding: 8, ...style }}>
      <InlineCell label='场景 ID'>{scene.ID}</InlineCell>
      <InlineCell label='场景名称'>
        <BizField.StringField
          value={scene.title}
          onChange={title => ctx.command.execute('UpdateSceneMeta', { ID: scene.ID, title })}
        />
      </InlineCell>
      <InlineCell label='场景封面'>
        <BizField.AssetsUploader
          enableImgCrop={{ aspect: 1 }}
          accept='image/*'
          value={scene.poster}
          onChange={poster => ctx.command.execute('UpdateSceneMeta', { ID: scene.ID, poster })}
        />
      </InlineCell>
      <InlineCell label='componentDefMap'>
        <BizField.ScriptEditorField
          mode='json'
          defaultValue={JSON.stringify(scene._scene?.componentDefs || [], null, 2)}
          onChange={v => {
            if (scene._scene) {
              scene._scene.componentDefs = JSON.parse(v);
              for (const compDef of scene._scene.componentDefs) {
                scene._scene.event.emit('afterComponentDefChange', { component: compDef.ID, _capture: true });
              }
            }
          }}
        />
      </InlineCell>

      <Button
        size='small'
        onClick={() => {
          if (scene.rootFlowHost) {
            const comDef = BizFlowNodeUtil.bizExtractAsComponent(
              scene.rootFlowHost.flowNodeManager.all,
              scene.rootFlowHost.flowEdgeManager.all,
              scene.ID
            );
            copy(JSON.stringify(comDef, null, 2));
            message.success('已复制');
          }
        }}
      >
        复制成组件
      </Button>
    </div>
  );
};
