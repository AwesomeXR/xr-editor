import { getMimeByFilename } from 'ah-memory-fs';

type JSZipObject = import('jszip').JSZipObject;

export async function getJSZip() {
  return import('jszip').then(m => m.default);
}

export const compress = async (files: File[], filename: string, onProgress?: (ps: number) => any) => {
  const JSZip = await getJSZip();

  const zip = new JSZip();
  files.map(file => zip.file(file.name, file, { createFolders: true }));

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }, meta => {
    onProgress?.(meta.percent / 100);
  });

  return new File([zipBlob], filename, { type: zipBlob.type || getMimeByFilename(filename) });
};

// 解压 zip
export const decompress = async (input: Blob, onProgress?: (ps: number) => any) => {
  const items: { relPath: string; entry: JSZipObject }[] = [];

  const JSZip = await getJSZip();
  const zip = await JSZip.loadAsync(input);
  zip.forEach((relPath, entry) => items.push({ relPath, entry }));

  const pgMap = new Map<string, number>();

  return Promise.all(
    items
      .filter(({ entry }) => !entry.dir)
      .map(async ({ entry }, _i, _items) => {
        const blob = await entry.async('blob', meta => {
          if (onProgress) {
            const filePg = meta.percent / 100;
            pgMap.set(entry.name, filePg);

            const totalPg = [...pgMap.values()].reduce((re, _pg) => re + _pg, 0) / _items.length;
            onProgress(totalPg);
          }
        });

        const mimeType = blob.type || getMimeByFilename(entry.name);
        return new File([blob], entry.name, { type: mimeType });
      })
  );
};
