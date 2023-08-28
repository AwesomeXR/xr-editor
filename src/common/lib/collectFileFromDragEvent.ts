import { FSUtil, MemoryAdapter, MemoryFS } from 'ah-memory-fs';
import { scanFiles } from './scanFiles';
import { readBlob } from './readBlob';

export async function collectFileFromDragEvent(ev: DragEvent, pathPrefix?: string): Promise<MemoryFS> {
  if (!ev.dataTransfer) throw new Error('no dataTransfer');

  const fileEntries: FileSystemEntry[] = [];

  // 收集所有文件
  // FIXME: 如果在一个循环里同时收集 FileSystemEntry 和 scanFiles，则会导致下个 FileSystemEntry 获取失败。不知道原因。
  for (let i = 0; i < ev.dataTransfer.items.length; i++) {
    const item = ev.dataTransfer.items[i];
    const entry = item.webkitGetAsEntry();

    if (!entry) {
      console.warn('cannot get entry: #%s', i + 1);
      continue;
    }

    fileEntries.push(entry);
  }

  const items: { file: File; path: string }[] = [];
  for (const entry of fileEntries) {
    items.push(...(await scanFiles(entry)));
  }

  const mfs = await MemoryFS.create(() => MemoryAdapter.empty()); // 临时写入到 tempMfs

  await FSUtil.quickWriteFiles(
    mfs,
    await Promise.all(
      items.map(async d => {
        const path = pathPrefix ? `${pathPrefix}/${d.path}` : d.path;
        const data = await readBlob(d.file, 'ArrayBuffer');
        return { path, data };
      })
    )
  );

  return mfs;
}
