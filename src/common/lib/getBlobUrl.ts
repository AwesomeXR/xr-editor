import { MemoryFS } from 'ah-memory-fs';
import { getExt } from './getExt';

export async function getBlobUrl(mfs: MemoryFS, url: string) {
  const ext = getExt(url);

  const nUrl = url.startsWith('file://')
    ? await mfs.readFile(url).then(data => URL.createObjectURL(new Blob([data])))
    : url;

  return { url: nUrl, ext };
}
