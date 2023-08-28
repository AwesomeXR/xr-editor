import { MemoryFS } from 'ah-memory-fs';
import { IBizIconName } from '../../common/component/BizIcon';
import { Deferred } from 'xr-core';
import { IPromptFn } from '../IPromptFn';
import { IXRCommand } from '../IXRCommand';

export type IFileTypeServiceItem = {
  title: string;
  cb: (mfs: MemoryFS, path: string, prompt: IPromptFn) => Promise<{ command: keyof IXRCommand; arg?: string } | void>;
};

export type IFileTypeData = {
  icon?: IBizIconName;
  infos?: { title: string; get: (mfs: MemoryFS, path: string) => Promise<string> }[];
  getPreview?: (mfs: MemoryFS, path: string) => Promise<string>;
  services?: IFileTypeServiceItem[];
};

export class FileTypeRegistry {
  static readonly Default = new FileTypeRegistry();

  private _store = new Map<string, IFileTypeData>();

  register(ext: string, data: IFileTypeData) {
    if (!ext.startsWith('.')) throw new Error('ext must start with `.`: ' + ext);
    this._store.set(ext, data);
  }

  get(ext: string) {
    return this._store.get(ext);
  }
}
