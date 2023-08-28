import { Schema } from 'ah-api-type';

export type IPromptFn = <T>(title: string, schema: Schema, defaultValue?: T) => Promise<T | null>;
