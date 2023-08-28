import { FSUtil, MemoryFS } from 'ah-memory-fs';
import Path from 'path';

export async function collectReferFilePathsInDeep(
  mfs: MemoryFS,
  entry: { type: 'json'; data: any } | { type: 'path'; path: string[] },
  skipSet: Set<string> = new Set()
): Promise<string[]> {
  const refPaths: string[] = [];

  if (entry.type === 'json') {
    const data = entry.data;
    refPaths.push(...(await FSUtil.collectReferFilePaths(mfs, data)));
  }
  //
  else {
    for (const path of entry.path) {
      if (skipSet.has(path)) continue;

      const ext = Path.extname(path).toLocaleLowerCase();

      switch (ext) {
        case '.json': {
          const data = await mfs.readFileAsJSON<any>(path);
          refPaths.push(...(await FSUtil.collectReferFilePaths(mfs, data)));
          break;
        }
        default:
          break;
      }
    }
  }

  // 递归查找
  if (refPaths.length) {
    refPaths.push(...(await collectReferFilePathsInDeep(mfs, { type: 'path', path: refPaths }, new Set(refPaths))));
  }

  return refPaths;
}
