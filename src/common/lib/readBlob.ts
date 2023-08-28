export async function readBlob(blob: Blob, type: 'DataUrl'): Promise<string>;
export async function readBlob(blob: Blob, type: 'Text'): Promise<string>;
export async function readBlob(blob: Blob, type: 'BinaryString'): Promise<string>;
export async function readBlob(blob: Blob, type: 'ArrayBuffer'): Promise<ArrayBuffer>;
export async function readBlob(blob: Blob, type: string) {
  return new Promise<any>((resolve, reject) => {
    const reader = new FileReader();

    // 读取操作结束时（要么成功，要么失败）触发
    reader.onloadend = () => {
      if (reader.error) return reject(reader.error);

      if (!reader.result) throw new Error('read blob empty');
      resolve(reader.result);
    };

    if (type === 'DataUrl') reader.readAsDataURL(blob);
    else if (type === 'Text') reader.readAsText(blob);
    else if (type === 'BinaryString') reader.readAsBinaryString(blob);
    else if (type === 'ArrayBuffer') reader.readAsArrayBuffer(blob);
  });
}
