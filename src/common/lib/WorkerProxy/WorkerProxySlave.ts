export class WorkerProxySlave {
  constructor() {
    addEventListener('message', this.exec);
  }

  private exec = async (ev: MessageEvent<{ method: string; args: any[] }>) => {
    const { method, args } = ev.data;

    const handlerName = `__handle_${method}`;
    const handler = (this as any)[handlerName];

    if (typeof handler === 'function') {
      const rsp = await handler.apply(this, args);
      postMessage(rsp);
    }
    //
    else throw new Error('invalid method: ' + method);
  };
}
