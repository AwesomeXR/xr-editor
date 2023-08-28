import { ConsoleAppender, IBaseAppender, ILoggerLevel, Logger, setGlobalLogLevel } from 'ah-logger';

const XR_RUNTIME_LOG = 'XR_RUNTIME_LOG';

// load from localStorage
// 无痕模式下 shopify iframe 打开会报错
// Failed to read the 'localStorage' property from 'Window': Access is denied for this document.
try {
  setGlobalLogLevel((ILoggerLevel as any)[localStorage.getItem(XR_RUNTIME_LOG) || 'INFO']);
} catch (err) {
  console.error(err);
}

window.addEventListener('storage', ev => {
  if (ev.key === XR_RUNTIME_LOG) {
    setGlobalLogLevel(ev.newValue ? (ILoggerLevel as any)[ev.newValue] : null);
  }
});

export class BizLogger extends Logger {
  constructor(readonly name: string) {
    super(name, [new ConsoleAppender(), new SLSAppender(name)]);
  }
}

export class SLSAppender implements IBaseAppender {
  constructor(private name: string) {}

  private sendRaw(data: Record<string, string | number>): void {
    const uploadData = {
      ...data,
      APIVersion: '0.6.0',
      arSdkVersion: VERSION,
    };

    // 开发环境不上传
    if (MODE === 'development') return console.log('AliSLS stub >>>', uploadData);

    const img = document.createElement('img');
    const query = new URLSearchParams(uploadData).toString();
    img.src = `https://zdclient.cn-hangzhou.log.aliyuncs.com/logstores/arsdk/track_ua.gif?${query}`;
  }

  private send(namespace: string, type: string, label: string, value: string | number) {
    return this.sendRaw({ namespace, type, label, value });
  }

  append(level: ILoggerLevel, fmt: string, ...args: any): void {
    if (level === ILoggerLevel.ERROR) {
      this.send(this.name, 'error', 'msg', fmt + ':' + args.join(','));
    }

    // 解析字符串上报 schema
    // 形如： @@a.b=c @@e.f=g
    const matchList = [...fmt.matchAll(/@@(\w+)\.(\w+)=(\w+)\s?/g)];
    matchList.forEach(m => {
      const [, type, label, value] = m;
      this.send(this.name, type, label, value);
    });
  }
}

export const DefaultBizLogger = new BizLogger('XR');
