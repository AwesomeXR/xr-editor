type IOnProgressCB = (pg: number) => any;

export class ProgressHelper {
  static format(pg: number) {
    return `${(pg * 100).toFixed(1)}%`;
  }

  static create<T extends string>(cb: IOnProgressCB = () => {}, ...segs: T[]) {
    return new ProgressHelper(cb).splitAvg(...segs);
  }

  constructor(private cb: IOnProgressCB = () => {}) {}

  splitAvg<T extends string>(
    ...segs: T[]
  ): {
    [k in T]: IOnProgressCB;
  } {
    const ps = {} as any;

    for (let i = 0; i < segs.length; i++) {
      const sn = segs[i];
      ps[sn] = (_pg: number) => this.cb((i + _pg) / segs.length);
    }

    return ps;
  }
}
