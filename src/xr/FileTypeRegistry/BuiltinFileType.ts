import { Deferred } from 'xr-core';
import { FileTypeRegistry, IFileTypeData } from './FileTypeRegistry';
import { MemoryFS } from 'ah-memory-fs';
import { GLTFUtil } from '../lib/GLTFUtil';
import { getImage } from '../../common';
import { getExt } from '../../common/lib/getExt';
import { buildCommand } from '../BuildCommand';

const ImageFileType: IFileTypeData = {
  icon: 'image_data',
  async getPreview(mfs, path) {
    const buf = await mfs.readFile(path);
    return URL.createObjectURL(new Blob([buf]));
  },
  infos: [
    {
      title: '尺寸',
      async get(mfs, path) {
        const buf = await mfs.readFile(path);
        const url = URL.createObjectURL(new Blob([buf]));
        const img = await getImage(url).ret;
        return `${img.naturalWidth}x${img.naturalHeight}`;
      },
    },
  ],
  services: [
    {
      title: '缩放',
      cb: async (mfs, path, prompt) => {
        const ans = await prompt<{ size: number }>('缩放配置', {
          type: 'object',
          properties: {
            size: { title: '新尺寸', type: 'integer', enum: [128, 256, 512, 1024, 2048, 4096] },
          },
          required: ['size'],
        });
        if (!ans) return;

        return buildCommand('File_Image_ResizeSquare', { path, ...ans });
      },
    },
    {
      title: 'GPU 纹理压缩',
      cb: async (mfs, path, prompt) => {
        const ext = getExt(path);
        if (!ext) throw new Error('文件后缀为空');

        const ans = await prompt<{ hasAlpha?: boolean; linearSpace?: boolean }>('压缩配置', {
          type: 'object',
          properties: {
            hasAlpha: { title: '透明通道', type: 'boolean' },
            linearSpace: { title: '线性空间', type: 'boolean' },
          },
        });
        if (!ans) return;

        const buf = await mfs.readFile(path);
        const url = URL.createObjectURL(new Blob([buf]));
        const img = await getImage(url).ret;

        const imgSize = Math.max(img.naturalHeight, img.naturalWidth);

        return buildCommand('File_Image_TextureCompress', {
          path,
          linear: ans.linearSpace,
          normal_map: ans.linearSpace,
          ktx2_no_zstandard: true,
          uastc: ans.hasAlpha || imgSize >= 512,
          uastc_level: 3,
          y_flip: true,
        });
      },
    },
  ],
};

const GLTFFileType: IFileTypeData = {
  icon: 'file_3D',
  services: [
    {
      title: '优化中文路径',
      cb: async (mfs, path) => {
        return buildCommand('File_GLTF_Optimize', { path });
      },
    },
  ],
};

FileTypeRegistry.Default.register('.jpg', ImageFileType);
FileTypeRegistry.Default.register('.jpeg', ImageFileType);
FileTypeRegistry.Default.register('.png', ImageFileType);
FileTypeRegistry.Default.register('.gif', ImageFileType);

FileTypeRegistry.Default.register('.gltf', GLTFFileType);
FileTypeRegistry.Default.register('.glb', { icon: 'file_3D' });

FileTypeRegistry.Default.register('.json', { icon: 'settings' });
