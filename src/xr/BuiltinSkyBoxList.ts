import { cdnImgResize } from '../common/lib/cdnImgResize';

export const BuiltinSkyBoxList: { label: string; value: string; snapshot: string }[] = [
  {
    label: 'blue sky',
    value: 'https://rshop.tech/gw/_shared/skybox/blue_sky.jpg.ktx2',
    snapshot: '',
  },
  {
    label: 'studio_1',
    value: 'https://rshop.tech/gw/_shared/skybox/studio_1.jpg.ktx2',
    snapshot: '',
  },
  {
    label: 'light pavilion',
    value: 'https://rshop.tech/gw/_shared/skybox/digital_painting_light_pavilion.jpg.ktx2',
    snapshot: '',
  },
];

// cdn resize
BuiltinSkyBoxList.forEach(item => {
  item.snapshot = cdnImgResize(300, item.value.replace('.ktx2', ''));
});
