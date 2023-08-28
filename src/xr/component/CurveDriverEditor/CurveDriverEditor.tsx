import { SettingOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Badge, Button, Checkbox, Col, Input, InputNumber, Popover, Row, Slider, Space, theme, Typography } from 'antd';
import _ from 'lodash';
import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BizField } from '../BizField';
import { IFlowNode } from 'ah-flow-node';
import { ColorFactory, InlineCell, useForceUpdate } from '../../../common';
import { isEdittimeNode } from '../../IFlowNodeEdittimeData';
import { Scalar } from 'xr-core';

export interface ICurveDriverEditorProps {
  className?: string;
  style?: React.CSSProperties;

  target: IFlowNode<'CurveDriverNode'>;
  width: number;
  height: number;

  headerSlot?: (content: any) => any;
}

type ISize = { width: number; height: number };
type IPos = { x: number; y: number };
type IRect = IPos & ISize;

type IKeyDataItem = { frame: number; value: number; inTangent?: number; outTangent?: number };

export const CurveDriverEditor = ({ className, style, target, width, height, headerSlot }: ICurveDriverEditorProps) => {
  if (!isEdittimeNode(target)) throw new Error('is not edittime node: ' + target.name);

  const { token } = theme.useToken();
  const fu = useForceUpdate();

  const [selectedChKey, setSelectedChKey] = useState<string>();

  const nodeInfo = useMemo(() => {
    if (!target) return;

    const chNames = Object.keys(target._define.output)
      .filter(k => k.startsWith('ch_evaluated_'))
      .map(k => k.replace(/^ch_evaluated_/, ''));

    const colors: Record<string, string> = {};
    const color = ColorFactory.create(chNames.length);

    for (let i = 0; i < chNames.length; i++) {
      colors[chNames[i]] = color(i);
    }

    return { chNames, colors };
  }, [target]);

  const visibleChKeys = nodeInfo?.chNames || [];

  const visibleChKeyColors = useMemo(() => {
    const colors: Record<string, string> = {};
    const color = ColorFactory.create(visibleChKeys.length);

    for (let i = 0; i < visibleChKeys.length; i++) {
      colors[visibleChKeys[i]] = color(i);
    }

    return colors;
  }, [visibleChKeys]);

  const [startFrame, setStartFrame] = useState<number>(target.input.__edittimeData?.CurveDriverEditor?.startFrame || 0);
  const [endFrame, setEndFrame] = useState<number>(target.input.__edittimeData?.CurveDriverEditor?.endFrame || 240);
  const [maxFrame, setMaxFrame] = useState<number>(target.input.__edittimeData?.CurveDriverEditor?.maxFrame || 240);

  const [selectedKeyDataIndex, setSelectedKeyDataIndex] = useState<Record<string, number>>({});

  const curvePanelRef = useRef<SVGSVGElement>(null);

  const cursorDragInfoRef = useRef<{ startContainerX: number; startContainerWidth: number; startOffsetX: number }>();
  const [isCursorDragging, setIsCursorDragging] = useState<boolean>(false);

  const keyPointDragInfoRef = useRef<{
    startContainerRect: IRect;
    chKey: string;
    startPos: IPos;
    startKeyIndex: number;
    startKeyData: IKeyDataItem;
  }>();
  const [isKeyPointDragging, setIsKeyPointDragging] = useState<boolean>(false);

  const curFrame = target.input.frame || 0;
  const setCurFrame = (frame: number) => {
    if (target) target.input.frame = frame;
  };

  const selectedChKeyData: IKeyDataItem[] | undefined =
    target && selectedChKey ? target.input[('ch_keyData_' + selectedChKey) as 'ch_keyData_default'] : undefined;

  const selectedChOutputValue: number | undefined =
    target && selectedChKey ? target.output[('ch_evaluated_' + selectedChKey) as 'ch_evaluated_default'] : undefined;

  const frameMatchChKeyDataInfo = useMemo(() => {
    const index = selectedChKeyData ? selectedChKeyData.findIndex(d => d.frame === curFrame) : -1;
    if (selectedChKeyData && index >= 0) return { index, item: selectedChKeyData[index] };
  }, [selectedChKeyData, curFrame]);

  const selectedChKeyDataItem = useMemo(() => {
    if (!selectedChKeyData || !selectedChKey) return;
    const index = selectedKeyDataIndex[selectedChKey];
    const item = selectedChKeyData[index];
    if (!item) return;
    return { index, item };
  }, [selectedChKeyData, selectedKeyDataIndex, selectedChKey]);

  useLayoutEffect(() => {
    const _handleMouseUp = () => {
      cursorDragInfoRef.current = undefined;
      keyPointDragInfoRef.current = undefined;
      setIsCursorDragging(false);
      setIsKeyPointDragging(false);
    };

    document.body.addEventListener('mouseup', _handleMouseUp);

    return () => {
      document.body.removeEventListener('mouseup', _handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (target) {
      // reload some from selectedNode
      const _initProp = target.input.__edittimeData?.CurveDriverEditor;

      if (_initProp) {
        if (typeof _initProp.startFrame === 'number') setStartFrame(_initProp.startFrame);
        if (typeof _initProp.endFrame === 'number') setEndFrame(_initProp.endFrame);
        if (typeof _initProp.maxFrame === 'number') setMaxFrame(_initProp.maxFrame);
      }

      const _remove = target.event.delegate((_type, _ev) => {
        if (_type.startsWith('input:change:')) fu.update();
      });

      return () => {
        _remove();
      };
    }
  }, [target]);

  useEffect(() => {
    if (target) {
      target.input.__edittimeData!.CurveDriverEditor = { startFrame, endFrame, maxFrame };
    }
  }, [target, startFrame, endFrame, maxFrame]);

  const ActiveChannelInfoHeight = 24;
  const FooterHeight = 40;

  const _updateChannelData = (chKey: string, data: IKeyDataItem[], merge?: boolean) => {
    let inData: IKeyDataItem[] = merge ? [...(selectedChKeyData || []), ...data] : data;
    inData = _.uniqBy(inData, d => d.frame); // 帧序号去重

    if (inData.length === 1 && inData[0].frame !== 0) {
      inData.push({ frame: 0, value: 0 });
    }

    target.input[('ch_keyData_' + chKey) as 'ch_keyData_default'] = _.sortBy(inData, t => t.frame);
  };

  const _updateChannelDataAtIndex = (chKey: string, index: number, dataItem: IKeyDataItem) => {
    const inData: IKeyDataItem[] = target.input[('ch_keyData_' + chKey) as 'ch_keyData_default'] || [];
    if (index > inData.length - 1) return;
    inData[index] = dataItem;
    _updateChannelData(chKey, inData);
  };

  const handleResetCurve = () => {
    if (!selectedChKey) return;
    _updateChannelData(selectedChKey, []);
  };

  const handleAddCurveKeyFrame = () => {
    if (!selectedChKey || !target) return;

    const _curValue: number = (target.output as any)[selectedChKey + '_value'] || 0;
    const _factor: number = (target.output as any)[selectedChKey + '_factor'] || 1;

    const insertValue: number = _curValue / _factor;

    _updateChannelData(selectedChKey, [{ frame: curFrame, value: insertValue }], true);
  };

  const handleRemoveCurveKeyFrame = () => {
    if (!selectedChKey || !target || !selectedChKeyDataItem || !selectedChKeyData) return;

    const newKeyData = selectedChKeyData.concat();
    newKeyData.splice(selectedChKeyDataItem.index, 1);

    _updateChannelData(selectedChKey, newKeyData);
  };

  const renderAxis = (host: IRect) => {
    const factor = (endFrame - startFrame) / host.width;
    const halfH = host.height / 2;

    const cursorMajor = 60;
    const cursorMinor = 10;

    const curvePathData = [
      `M 0,${halfH.toFixed(1)}`,
      ..._.range(0, host.width, cursorMinor).map(
        x => `M ${x},${halfH.toFixed(1)} L ${x},${(x % cursorMajor === 0 ? halfH + 20 : halfH + 6).toFixed(1)}`
      ),
    ].join(' ');

    return (
      <g id='Axis'>
        <line
          id='Axis.x'
          pointerEvents='none'
          x1={0}
          x2={host.width}
          y1={host.height / 2}
          y2={host.height / 2}
          stroke='red'
        />
        <path id='Axis.x.cursor' pointerEvents='none' d={curvePathData} stroke='green' fill='none' />
        <g fontSize={12}>
          {_.range(0, host.width, cursorMajor).map(x => (
            <text
              key={x}
              x={x + 1}
              y={halfH + 20}
              children={(x * factor + startFrame).toFixed(1)}
              cursor='pointer'
              onClick={() => setCurFrame(x * factor + startFrame)}
            />
          ))}
        </g>
      </g>
    );
  };

  const renderFrameCursor = (host: IRect) => {
    if (!_.inRange(curFrame, startFrame, endFrame)) return null;

    const factor = (endFrame - startFrame) / host.width;
    const offsetX = (curFrame - startFrame) / factor;

    return (
      <g id={'FrameCursor'}>
        <path d={`M ${offsetX},0 L ${offsetX},${host.height}`} stroke='blue' fill='none' pointerEvents='none' />
        <rect
          x={offsetX - 4}
          y={0}
          width={8}
          height={host.height}
          fill='transparent'
          cursor='pointer'
          onMouseDown={ev => {
            if (!curvePanelRef.current) return;
            const { x: startContainerX, width: startContainerWidth } = curvePanelRef.current.getBoundingClientRect();
            const startOffsetX = ev.clientX - startContainerX;
            cursorDragInfoRef.current = { startContainerX, startOffsetX, startContainerWidth };

            setIsCursorDragging(true);
          }}
        />
      </g>
    );
  };

  const renderChannelValueCurve = (host: IRect, chKey: string) => {
    if (!target || !nodeInfo) return null;

    const factor = (endFrame - startFrame) / host.width;
    const keyData: IKeyDataItem[] = target.input[('ch_keyData_' + chKey) as 'ch_keyData_default'] || [];

    const halfH = host.height / 2;

    const endPoints = keyData.map((d, i) => ({
      x: (d.frame - startFrame) / factor,
      y: halfH - d.value * halfH,
      keyIndex: i,
      item: d,
    }));

    const curvePathData = [`M 0,${halfH}`, ...endPoints.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`)].join(' ');
    const curveColor = visibleChKeyColors[chKey];

    const isCurveSelected = selectedChKey === chKey;

    return (
      <g id={chKey} key={chKey}>
        <path
          d={curvePathData}
          stroke={curveColor}
          strokeWidth={isCurveSelected ? 3 : 1}
          fill='none'
          cursor='pointer'
          onMouseDown={() => setSelectedChKey(chKey)}
        />
        <g fill='blue'>
          {endPoints.map(ep => {
            const isEpSelected = isCurveSelected && selectedChKeyDataItem?.index === ep.keyIndex;

            return (
              <circle
                key={ep.keyIndex}
                cx={ep.x.toFixed(1)}
                cy={ep.y.toFixed(1)}
                cursor={isCurveSelected ? 'pointer' : undefined}
                r={isEpSelected ? 6 : 4}
                fill={isEpSelected ? 'red' : curveColor}
                onMouseDown={ev => {
                  if (!curvePanelRef.current) return;
                  if (!isCurveSelected) return;

                  if (!isEpSelected) {
                    setSelectedKeyDataIndex(v => ({ ...v, [chKey]: ep.keyIndex }));
                    return;
                  }

                  const startContainerRect = curvePanelRef.current.getBoundingClientRect();
                  const startPos = { x: ev.clientX - startContainerRect.x, y: ev.clientY - startContainerRect.y };
                  keyPointDragInfoRef.current = {
                    startContainerRect,
                    startPos,
                    startKeyIndex: ep.keyIndex,
                    startKeyData: ep.item,
                    chKey,
                  };

                  setIsKeyPointDragging(true);
                }}
              />
            );
          })}
        </g>
      </g>
    );
  };

  const renderActiveChannelInfo = () => {
    if (!selectedChKey || !target) {
      return <div style={{ height: ActiveChannelInfoHeight, color: token.colorText }}>没有选中通道</div>;
    }

    const chKey = selectedChKey;

    return (
      <Row
        key={target.ID}
        align='middle'
        justify='space-between'
        style={{ height: ActiveChannelInfoHeight, color: token.colorText }}
      >
        <Space size='small'>
          <code>[{selectedChKeyDataItem ? selectedChKeyDataItem.index : '-'}]</code>
          <a
            onClick={() => {
              if (selectedChKeyDataItem) setCurFrame(selectedChKeyDataItem.item.frame);
            }}
          >
            <code>#{selectedChKeyDataItem ? selectedChKeyDataItem.item.frame.toFixed(1) : '-'}</code>
          </a>
          <code>{selectedChKeyDataItem ? selectedChKeyDataItem.item.value.toFixed(3) : '-'}</code>
          <Popover
            trigger='click'
            destroyTooltipOnHide
            title='调整帧参数'
            content={() => {
              const _item = selectedChKeyDataItem;
              if (!_item) return;

              const _updateValue = (v: number): void => {
                _updateChannelDataAtIndex(chKey, _item.index, { ..._item.item, value: v });
              };

              return (
                <div style={{ width: 300 }}>
                  <InlineCell label='帧序号'>
                    <BizField.NumberField
                      min={0}
                      max={maxFrame}
                      step={1}
                      value={_item.item.frame}
                      onChange={v => _updateChannelDataAtIndex(chKey, _item.index, { ..._item.item, frame: v || 0 })}
                    />
                  </InlineCell>
                  <InlineCell label='帧数值'>
                    <BizField.NumberField
                      min={-1}
                      max={1}
                      step={0.1}
                      value={_item.item.value}
                      onChange={_updateValue}
                    />
                    <br />
                    <Space size='small'>
                      {[-1, -0.5, 0, 0.5, 1].map(v => (
                        <Button size='small' type='link' key={v} onClick={() => _updateValue(v)}>
                          {v.toFixed(1)}
                        </Button>
                      ))}
                    </Space>
                  </InlineCell>
                </div>
              );
            }}
          >
            <Button type='text' disabled={!selectedChKeyDataItem} size='small' icon={<SettingOutlined />} />
          </Popover>
        </Space>

        <Typography.Text code>
          {typeof selectedChOutputValue === 'number' ? selectedChOutputValue : '-'}
        </Typography.Text>
      </Row>
    );
  };

  const renderCurvePanel = () => {
    width -= 100;
    height -= ActiveChannelInfoHeight + FooterHeight;

    return (
      <svg
        width={width}
        height={height}
        style={{ display: 'block', height, width, color: token.colorText }}
        ref={curvePanelRef}
        cursor={isCursorDragging || isKeyPointDragging ? 'pointer' : undefined}
      >
        {renderAxis({ x: 0, y: 0, width, height })}
        {renderFrameCursor({ x: 0, y: 0, width, height })}
        <g>{visibleChKeys.map(chKey => renderChannelValueCurve({ x: 0, y: 0, width, height }, chKey))}</g>
      </svg>
    );
  };

  const renderHeader = () => {
    if (!headerSlot) return null;

    return headerSlot(
      <Row align='middle' justify='space-between'>
        <Space.Compact size='small'>
          <Button onClick={handleResetCurve}>重置</Button>
          <Button disabled={!!frameMatchChKeyDataInfo} onClick={handleAddCurveKeyFrame}>
            插入
          </Button>
          <Button disabled={!selectedChKeyDataItem} onClick={handleRemoveCurveKeyFrame}>
            删除
          </Button>
        </Space.Compact>

        <Space.Compact size='small'>
          <InputNumber
            step={1}
            min={0}
            max={maxFrame}
            value={curFrame}
            onChange={v => typeof v === 'number' && setCurFrame(v)}
            style={{ width: 60 }}
          />
          <InputNumber
            step={30}
            min={0}
            value={maxFrame}
            onChange={v => typeof v === 'number' && setMaxFrame(v)}
            style={{ width: 60 }}
          />
        </Space.Compact>
      </Row>
    );
  };

  const renderFrameRangeBar = () => {
    return (
      <Row align='middle' style={{ height: FooterHeight, padding: '0 8px' }}>
        <Slider
          range
          min={0}
          max={maxFrame}
          value={[startFrame, endFrame]}
          onChange={([_s, _e]) => (setStartFrame(_s), setEndFrame(_e))}
          style={{ width: '100%' }}
        />
      </Row>
    );
  };

  const renderChannelList = () => {
    if (!target || !nodeInfo) return null;

    const list: any[] = [];

    for (let i = 0; i < nodeInfo.chNames.length; i++) {
      const ch = nodeInfo.chNames[i];
      if (!visibleChKeys.includes(ch)) continue;

      const isSelected = selectedChKey === ch;
      const color = visibleChKeyColors[ch];

      list.push(
        <Button
          key={i}
          block
          ghost
          size='small'
          type={isSelected ? 'primary' : 'default'}
          onClick={() => setSelectedChKey(ch)}
          style={{ borderRadius: 0 }}
        >
          <Badge size='small' color={color} text={<code>{ch}</code>} />
        </Button>
      );
    }

    return <>{list}</>;
  };

  return (
    <div
      data-name='CurveDriverEditor'
      className={className}
      style={{ height, width, ...style }}
      onMouseMove={ev => {
        // 优先处理 keyPoint 拖拽
        if (keyPointDragInfoRef.current) {
          ev.preventDefault();
          ev.stopPropagation();

          const kp = keyPointDragInfoRef.current;
          const _hh = kp.startContainerRect.height / 2;

          let frameValue = ((ev.clientY - (kp.startContainerRect.y + _hh)) * -1) / _hh;
          frameValue = Scalar.Clamp(frameValue, -1, 1);

          _updateChannelDataAtIndex(kp.chKey, kp.startKeyIndex, { ...kp.startKeyData, value: frameValue });
        }

        //
        else if (cursorDragInfoRef.current) {
          ev.preventDefault();
          ev.stopPropagation();

          const curOffsetX = ev.clientX - cursorDragInfoRef.current.startContainerX;
          let frame = Math.round(
            (curOffsetX / cursorDragInfoRef.current.startContainerWidth) * (endFrame - startFrame) + startFrame
          );
          frame = Scalar.Clamp(frame, startFrame, endFrame);
          setCurFrame(frame);
        }
      }}
    >
      {renderHeader()}

      <Row style={{ height }}>
        <Col className='hideScrollbar' style={{ width: 100, height, overflow: 'auto' }}>
          {renderChannelList()}
        </Col>
        <Col style={{ width: 1, flex: 1, height }}>
          {renderActiveChannelInfo()}
          {renderCurvePanel()}
          {renderFrameRangeBar()}
        </Col>
      </Row>
    </div>
  );
};
