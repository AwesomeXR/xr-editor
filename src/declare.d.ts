// 下面这些是从 webpack 中获取的变量

declare const ASSETS_ORIGIN: string;
declare const ASSETS_PREFIX: string;
declare const VERSION: string;
declare const MODE: 'development' | 'production';

declare const DEPLOY_OSS_REGION: string;
declare const DEPLOY_OSS_BUCKET: string;
declare const DEPLOY_OSS_AK: string;
declare const DEPLOY_OSS_SK: string;

declare class GIF {
  constructor(config: {
    quality?: number;
    workerScript?: string;
    width?: number;
    height?: number;
    workers?: number;
  }): GIF;

  addFrame(target: any, opt?: { delay?: number; copy?: boolean; dispose?: number }): void;
  render(): void;

  on(evt: 'finished', cb: (data: Blob) => any);
  on(evt: 'progress', cb: (progress: number) => any);
  on(evt: 'abort', cb: () => any);
}
