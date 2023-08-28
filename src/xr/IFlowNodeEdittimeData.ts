import { Schema } from 'ah-api-type';
import {
  IDefaultFlowNode,
  IFlowDTKey,
  IFlowNodeClassNames,
  IFlowNodeFromMeta,
  IFlowNodeInput,
  IFlowNodeMetaMap,
} from 'ah-flow-node';

export interface IFlowNodeEdittimeData {
  selected?: boolean; // 是否选中

  flowPos?: { x: number; y: number };
  __parentID?: string; // 有时候需要标记一下父节点(这个父子关系是虚拟的, 不会影响到节点的实际连接关系)

  CurveDriverEditor?: { startFrame?: number; endFrame?: number; maxFrame?: number };
}

export type IXRFlowNodeDTBizRender =
  | { type: 'FileAssets'; acceptExts?: string[] }
  | { type: 'CodeEditor'; lang?: 'text' | 'html' | 'javascript' | 'json' }
  | { type: 'JSON'; schema: Schema };

export const isEdittimeNode = <C extends IFlowNodeClassNames>(
  node: any
): node is IFlowNodeFromMeta<{
  className: C;
  input: IFlowNodeMetaMap[C]['input'] & { __edittimeData: 'EdittimeData' };
  output: IFlowNodeMetaMap[C]['output'];
}> => {
  return !!node._define.input['__edittimeData'];
};

export type ExtendFlowNodeDefine<
  C extends IFlowNodeClassNames,
  INPUT extends Record<string, any>,
  OUTPUT extends Record<string, any>,
> = IFlowNodeFromMeta<{
  className: C;
  input: IFlowNodeMetaMap[C]['input'] & INPUT;
  output: IFlowNodeMetaMap[C]['output'] & OUTPUT;
}>;

export type IDTViewProps = {
  className?: string;
  style?: React.CSSProperties;
  ioKey: string;
  ioDef: IFlowNodeInput<IFlowDTKey>;
  node: IDefaultFlowNode;
};
