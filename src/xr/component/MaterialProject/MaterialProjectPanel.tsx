import React, { useContext, useState } from 'react';
import {
  IBizMenuItem,
  InlineCell,
  SimpleSelect,
  useFWHeaderSlot,
  useFWQuery,
  useForceUpdate,
  useListen,
} from '../../../common';
import { BizXRMenuBar } from '../BizXRMenuBar';
import { XREditorContext } from '../../XREditorContext';
import { CommandSystem } from '../../ViewModel/CommandSystem';
import { Button, Col, Collapse, Row, Space } from 'antd';
import { PBRCPreview } from './PBRCPreview';
import { PBRCLayer } from './PBRCLayer';
import { BizField } from '../BizField';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';

export interface IMaterialProjectPanelProps {
  className?: string;
  style?: React.CSSProperties;
}

export const MaterialProjectPanel = ({ className, style }: IMaterialProjectPanelProps) => {
  const ctx = useContext(XREditorContext);
  const headerSlot = useFWHeaderSlot();
  const fu = useForceUpdate();

  const { query, getQuery, setQuery } = useFWQuery<{ activeComposerName?: string }, string>();
  const [slotMaskPreview, setSlotMaskPreview] = useState<Record<string, boolean>>({});

  useListen(ctx.project.event, 'afterActiveSceneChange', fu.update);
  useListen(ctx.project.event, 'PbrComposer:afterConfigChange', fu.update);

  useListen(ctx.project.event, 'afterPbrComposerAdd', ev => {
    setQuery({ ...getQuery(), activeComposerName: ev.name });
    fu.update();
  });

  const activeComposer = ctx.project.pbrComposers.find(pc => pc.name === query?.activeComposerName);

  const renderHeader = () => {
    const scene = ctx.project.activeScene;
    if (!scene) return null;

    const pcItems: IBizMenuItem[] = ctx.project.pbrComposers.map(pc => ({
      title: pc.name,
      icon: query?.activeComposerName === pc.name ? 'checkmark' : undefined,
      command: '_select',
      arg: pc.name,
    }));

    return headerSlot(
      <BizXRMenuBar
        external={{
          _select: {
            execute: arg => {
              setQuery({ ...query, activeComposerName: arg });
              fu.update();
            },
          },
        }}
        datasource={[
          { title: '合成器', items: [...pcItems, { title: '新建', ...CommandSystem.build('CreatePBRComposer', {}) }] },
        ]}
      />
    );
  };

  const renderSlots = () => {
    if (!activeComposer) return null;

    return (
      <div>
        {/* <InlineCell label='ID 遮罩'>
          <BizField.AssetsPicker
            value={activeComposer.maskPath}
            onChange={v => {
              activeComposer.maskPath = v;
            }}
          />
        </InlineCell> */}

        <Collapse>
          {Object.entries(activeComposer.config.slots).map(([slotName, slot]) => (
            <Collapse.Panel key={slotName} header={'绘制槽:' + slotName}>
              <Space.Compact size='small'>
                <Button
                  icon={<PlusOutlined />}
                  disabled={!ctx.command.isEnabled('PBRC_AddLayer', { composer: activeComposer.name, slot: slotName })}
                  onClick={() =>
                    ctx.command.execute('PBRC_AddLayer', { composer: activeComposer.name, slot: slotName })
                  }
                />
                <Button
                  icon={<EyeOutlined />}
                  type={slotMaskPreview[slotName] ? 'primary' : undefined}
                  onClick={() => setSlotMaskPreview({ ...slotMaskPreview, [slotName]: !slotMaskPreview[slotName] })}
                />
              </Space.Compact>

              {slot.layers.map((layer, i) => (
                <PBRCLayer key={i} composer={activeComposer} layer={layer} />
              ))}
            </Collapse.Panel>
          ))}
        </Collapse>
      </div>
    );
  };

  const previewSlotNames: string[] = [];
  Object.keys(slotMaskPreview).forEach(k => {
    if (slotMaskPreview[k]) previewSlotNames.push(k);
  });

  return (
    <>
      {renderHeader()}

      <div data-name='MaterialProjectPanel' className={className} style={{ height: '100%', ...style }}>
        <Row style={{ height: '100%' }}>
          <Col span={12} className='hideScrollbar' style={{ height: '100%', overflow: 'auto', background: '#fcfcfc' }}>
            {activeComposer && <PBRCPreview composer={activeComposer} previewSlotNames={previewSlotNames} />}
          </Col>
          <Col span={12} className='hideScrollbar' style={{ height: '100%', overflow: 'auto' }}>
            {renderSlots()}
          </Col>
        </Row>
      </div>
    </>
  );
};
