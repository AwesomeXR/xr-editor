export const cdnImgResize = (width: number, url: string) => {
  const q = `image_process=resize,w_${width}`;
  if (url.includes('?')) return url + '&' + q;
  return url + '?' + q;
};

cdnImgResize.ratio = (ratio: number, url: string) => {
  return cdnImgResize(window.innerWidth * window.devicePixelRatio * ratio, url);
};
