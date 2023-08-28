import { MemoryFS } from 'ah-memory-fs';

export const GLTFUtil = {
  async decodeCnPath(mfs: MemoryFS, path: string) {
    const gltf = await mfs.readFileAsJSON<any>(path);

    if (gltf.images && Array.isArray(gltf.images)) {
      (gltf.images as any[]).forEach(item => {
        if (typeof item.uri === 'string') {
          item.uri = decodeURIComponent(item.uri);
        }
      });
    }

    await mfs.writeFileAsJSON(path, gltf);
  },
};
