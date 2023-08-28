export function getDataUrlInfo(dataURL: string) {
  const segs = dataURL.split(',');
  const mime: string | undefined = (segs[0].match(/:(.*?);/) || [])[1];
  return { segs, mime };
}

export function dataUrl2Blob(dataUrl: string) {
  const { segs, mime } = getDataUrlInfo(dataUrl);

  const bstr = (atob as any)(segs[1]);
  const u8arr = new Uint8Array(bstr.length);

  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mime });
}

dataUrl2Blob.getDataUrlInfo = getDataUrlInfo;
