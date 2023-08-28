import { EventBus } from 'ah-event-bus';
import { createContext } from 'react';
import { CommandSystem } from './ViewModel/CommandSystem';
import { XRProjectModel } from './ViewModel/XRProjectModel';
import { Schema } from 'ah-api-type';
import { IPromptFn } from './IPromptFn';
import { IXREditorFeatureConfig } from './XREditor';

export type ISlotRenderer = {
  headerLeading?: () => any;
};

export type IXREditorEvent = {
  forceUpdateFlowNode: { ID: string };
  promptQuery: { title: string; schema: Schema; defaultValue?: any };
  promptResponse: { value: any };
};

export type IXREditorContext = {
  project: XRProjectModel;
  command: CommandSystem;
  slotRenderer?: ISlotRenderer;
  feature: IXREditorFeatureConfig;

  prompt: IPromptFn;

  event: EventBus<IXREditorEvent>;
};

export const XREditorContext = createContext<IXREditorContext>(null as any);
