import { Shape } from '@antv/x6';
import ThemeToken from '../../../ThemeToken.json';

Shape.Rect.define({
  shape: 'FlowNode',
  width: 180,
  height: 80,

  ports: {
    groups: {
      input: {
        position: 'left',
        label: { position: 'inside' },
        attrs: {
          circle: { r: 6, magnet: true, strokeWidth: 0 },
          text: { 'font-size': '12px' },
        },
      },
      output: {
        position: 'right',
        label: { position: 'inside' },
        attrs: {
          circle: { r: 6, magnet: true, strokeWidth: 0 },
          text: { 'font-size': '12px' },
        },
      },
    },
  },
  attrs: {
    rect: {
      rx: 4,
      strokeWidth: 1,
      fill: ThemeToken.colorBgElevated,
    },
    text: {
      refX: 0.5,
      refY: -18,
      textAnchor: 'middle',
      textVerticalAnchor: 'top',
      'font-weight': 'bolder',
      fill: ThemeToken.colorText,
    },
  },
});

Shape.Edge.define({
  shape: 'FlowEdge',
  router: { name: 'er', args: { direction: 'H', offset: 24 } },
  connector: { name: 'rounded' },
  attrs: {
    line: { stroke: '#8f8f8f', strokeWidth: 2 },
  },
});
