import { Field } from '../../../common/component/Field';
import { AssetsPicker } from './AssetsPicker';
import { AssetsUploader } from './AssetsUploader';
import { FileExplorer } from './FileExplorer';
import { GalleryField } from './GalleryField';
import { IODefMap } from './IODefMap';
import { ImageUploader } from './ImageUploader';

export const BizField = {
  ...Field,
  FileExplorer,
  AssetsPicker,
  AssetsUploader,
  IODefMap,
  GalleryField,
  ImageUploader,
};
