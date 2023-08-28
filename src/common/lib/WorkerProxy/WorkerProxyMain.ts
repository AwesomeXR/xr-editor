import { Deferred } from 'xr-core';
import { getInternalRandomString } from '../getInternalRandomString';

export type IWorkerPool = { worker: Worker; busy?: boolean };

export class WorkerProxyMain {
  constructor(private _workers: Worker[]) {}

  private pools: IWorkerPool[] = this._workers.map(worker => ({ worker }));
  private taskPipe: { id: string; method: string; args: any; defer: Deferred<any> }[] = [];

  protected async invoke<P extends any[], T>(method: string, args: P): Promise<T> {
    const id = method + '_' + getInternalRandomString(true);

    const defer = new Deferred<T>(id);
    this.taskPipe.push({ id, method, args, defer });
    this.flush();

    return defer.ret;
  }

  protected async invokeWithWorker(worker: Worker, method: string, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const handleMsg = (ev: MessageEvent<any>) => {
        worker.removeEventListener('message', handleMsg);
        clearTimeout(timer);
        resolve(ev.data);
      };

      worker.addEventListener('message', handleMsg);

      // FIXME: transferable 优化
      worker.postMessage({ method, args });

      // 启动超时倒计时
      const tMs = 10 * 60e3;
      const timer = setTimeout(() => reject(new Error(`invoke timeout: ${tMs / 1000}s`)), tMs);
    });
  }

  private flush() {
    const task = this.taskPipe.shift();
    if (!task) return;

    const idlePool = this.pools.find(p => !p.busy);

    if (!idlePool) {
      this.taskPipe.push(task); // 重新入列
      return;
    }

    idlePool.busy = true;

    this.invokeWithWorker(idlePool.worker, task.method, task.args)
      .then(ret => task.defer.resolve(ret))
      .catch(err => task.defer.reject(err))
      .finally(() => {
        idlePool.busy = false;
        this.flush();
      });
  }
}
