import { FlowDTRegistry, IDefaultFlowNode, IFlowDTKey, IFlowNodeInput, Util } from 'ah-flow-node';
import { Typography } from 'antd';
import { BaseType } from 'antd/es/typography/Base';
import _, { isNull } from 'lodash';
import React, { useContext } from 'react';
import { IInlineCellProps, InlineCell } from '../../common/component/InlineCell';
import { useForceUpdate } from '../../common/hook/useForceUpdate';
import { useSetup } from '../../common/hook/useSetup';
import { formatFileSize } from '../../common/lib/formatFileSize';
import { XREditorContext } from '../XREditorContext';
import { BizField } from './BizField';
import { Color3, Color4 } from 'xr-core';
import { CurveDriverChannelViewer, CurveDriverEditor } from './CurveDriverEditor';

export interface IFlowNodePropRenderProps {
  className?: string;
  style?: React.CSSProperties;
  target: IDefaultFlowNode;
}

export const FlowNodePropRender = ({ className, style, target }: IFlowNodePropRenderProps) => {
  const editor = useContext(XREditorContext);
  const fu = useForceUpdate();

  useSetup(() => {
    const lazyUpdate = _.throttle(() => fu.update(), 200);

    const removeEv = target.event.delegate(() => {
      lazyUpdate();
    });

    return () => {
      lazyUpdate.cancel();
      removeEv();
    };
  }, [target]);

  const renderInput = (inKey: string, ioDef: IFlowNodeInput<IFlowDTKey>) => {
    // 适配同名输入输出的情况(这是一个约定)
    const _value =
      typeof (target.input as any)[inKey] !== 'undefined'
        ? (target.input as any)[inKey]
        : (target.output as any)[inKey];

    const _onChange = (v: any) => {
      (target.input as any)[inKey] = v;
      fu.update();
    };

    let labelAlign: IInlineCellProps['labelAlign'] = 'fixe-width';
    let filedNode: any;

    const flowDT = FlowDTRegistry.Default.get(ioDef.dataType);

    if (ioDef.bizRender) {
      if (ioDef.bizRender.type === 'FileAssets') {
        filedNode = (
          <BizField.AssetsPicker value={_value} onChange={_onChange} acceptExts={ioDef.bizRender.acceptExts} />
        );
      } else if (ioDef.bizRender.type === 'CodeEditor') {
        filedNode = (
          <BizField.ScriptEditorField defaultValue={_value} onChange={_onChange} mode={ioDef.bizRender.lang} />
        );
      } else if (ioDef.bizRender.type === 'JSON') {
        if (ioDef.bizRender.schema) {
          filedNode = <BizField.JSONSchemaField value={_value} onChange={_onChange} schema={ioDef.bizRender.schema} />;
        } else {
          let _strValue: string;

          try {
            _strValue = JSON.stringify(_value, null, 2);
          } catch (err) {
            _strValue = '';
          }

          filedNode = (
            <BizField.ScriptEditorField
              mode='json'
              defaultValue={_strValue}
              onChange={code => {
                try {
                  _onChange(JSON.parse(code));
                } catch (err) {}
              }}
            />
          );
        }
      } else {
        filedNode = <BizField.StringField value={_value} onChange={_onChange} />; // 兜底
      }
    }
    //
    else if (flowDT?.View) {
      filedNode = <flowDT.View ioDef={ioDef} ioKey={inKey} node={target} />;
    }
    //
    else {
      if (ioDef.dataType === 'Boolean') {
        labelAlign = 'grow';
        filedNode = <BizField.BooleanField value={_value} onChange={_onChange} />;
      } else if (ioDef.dataType === 'Number') {
        filedNode = <BizField.NumberField value={_value} onChange={_onChange} />;
      } else if (ioDef.dataType === 'String') {
        filedNode = <BizField.StringField value={_value} onChange={_onChange} />;
      } else if (ioDef.dataType === 'BoundBox') {
        filedNode = 'BoundBox';
      } else if (ioDef.dataType === 'Vector2') {
        filedNode = <BizField.Vector2Field value={_value} onChange={_onChange} />;
      } else if (ioDef.dataType === 'Vector3') {
        filedNode = <BizField.Vector3Field value={_value} onChange={_onChange} />;
      } else if (ioDef.dataType === 'Color3' || ioDef.dataType === 'Color4') {
        labelAlign = 'grow';
        filedNode = (
          <BizField.ColorHexField
            value={_value ? (_value as Color4).toGammaSpace().asArray() : undefined}
            onChange={v => _onChange(Color4.FromArray(v).toLinearSpace())}
          />
        );
      } else if (ioDef.dataType === 'Message') {
        let displayText: string;
        let textType: BaseType | undefined;
        try {
          if (_.isTypedArray(_value)) {
            displayText = `<binary> ` + formatFileSize((_value as Buffer).byteLength);
          } else if (_.isUndefined(_value)) {
            displayText = '<undefined>';
            textType = 'secondary';
          } else {
            displayText = `<${typeof _value}> ` + JSON.stringify(_value);
          }
        } catch (err) {
          displayText = '无法解析';
          textType = 'secondary';
        }
        filedNode = <Typography.Text type={textType} children={displayText} />;
      } else {
        // 兜底
        if (_value && _value.name) {
          filedNode = <Typography.Text>{_value.name}</Typography.Text>;
        } else {
          if (typeof _value === 'undefined') filedNode = <Typography.Text type='secondary'>未设置</Typography.Text>;
          else if (isNull(_value)) filedNode = <Typography.Text type='secondary'>{'<NULL>'}</Typography.Text>;
          else filedNode = <Typography.Text type='secondary'>没有控件</Typography.Text>;
        }
      }
    }

    // FIXME: CurveDriverNode 特殊处理
    if (Util.isFlowNode('CurveDriverNode', target) && inKey.startsWith('ch_keyData_')) {
      filedNode = <CurveDriverChannelViewer target={target} channel={inKey.replace(/^ch_keyData_/, '')} />;
    }

    if (Util.isFlowNode('FrameTimerNode', target) && inKey === 'frame') {
      filedNode = target.input.range ? (
        <BizField.SliderField
          value={_value}
          onChange={_onChange}
          min={target.input.range.x}
          max={target.input.range.y}
          step={1}
        />
      ) : (
        <BizField.NumberField value={_value} onChange={_onChange} />
      );
    }

    return (
      <InlineCell key={inKey} label={ioDef.title || inKey} labelAlign={labelAlign}>
        {filedNode}
      </InlineCell>
    );
  };

  return (
    <div data-name='FlowNodePropRender' key={target.ID} className={className} style={style}>
      {Object.entries(target._define.input as Record<string, IFlowNodeInput<any>>)
        .filter(d => !d[1].hiddenInPropertyPanel)
        .map(([inKey, ioDef]) => renderInput(inKey, ioDef))}
    </div>
  );
};
