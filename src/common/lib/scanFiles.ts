export async function scanFiles(entry: FileSystemEntry): Promise<{ path: string; file: File }[]> {
  if (entry.isDirectory) {
    const reader: FileSystemDirectoryReader = (entry as any).createReader();
    const subEntries = await new Promise<FileSystemEntry[]>(resolve => reader.readEntries(resolve));

    const recs: { path: string; file: File }[] = [];

    for (let i = 0; i < subEntries.length; i++) {
      const subEntry = subEntries[i];
      recs.push(...(await scanFiles(subEntry)));
    }

    return recs;
  }

  return new Promise(resolve => {
    (entry as any).file((file: File) => resolve([{ file, path: entry.fullPath }]));
  });
}
