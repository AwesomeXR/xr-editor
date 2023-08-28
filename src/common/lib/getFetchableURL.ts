import { MemoryFS } from 'ah-memory-fs';

export async function getFetchableURL(mfs: MemoryFS, src: string) {
  return src.startsWith('file://')
    ? mfs.readFile(src).then(dat => URL.createObjectURL(new Blob([dat])))
    : Promise.resolve(src);
}
