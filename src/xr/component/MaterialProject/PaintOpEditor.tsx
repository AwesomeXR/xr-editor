import React from 'react';
import { InlineCell } from '../../../common';
import { BizField } from '../BizField';
import { IPaintOp } from '../../../common/lib/PaintOp';

export interface IPaintOpEditorProps {
  className?: string;
  style?: React.CSSProperties;

  value: IPaintOp;
  onChange: (value: IPaintOp) => any;
}

export const PaintOpEditor = ({ className, style, value, onChange }: IPaintOpEditorProps) => {
  return (
    <div data-name='PaintOpEditor' className={className} style={style}>
      <InlineCell label='方法'>
        <BizField.SelectField
          options={[
            { label: '填充颜色', value: 'FillColor' },
            { label: '填充图像', value: 'FillImage' },
          ]}
          value={value.type}
          onChange={t => onChange({ type: t as any } as IPaintOp)}
        />
      </InlineCell>

      {value.type === 'FillColor' && (
        <>
          <InlineCell label='颜色'>
            <BizField.ColorHexField
              value={value.arg ? value.arg.color.map(c => c / 255) : undefined}
              onChange={rgba => onChange({ ...value, arg: { ...value.arg, color: rgba.map(c => c * 255) } })}
            />
          </InlineCell>
        </>
      )}

      {value.type === 'FillImage' && (
        <>
          <InlineCell label='图像'>
            {/* <BizField.AssetsPicker value={act.image} onChange={v => onChange({ ...act, image: v })} /> */}
          </InlineCell>
        </>
      )}
    </div>
  );
};
