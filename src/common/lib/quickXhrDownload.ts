export const quickXhrDownload = async <T>(
  url: string,
  responseType: XMLHttpRequestResponseType,
  onProgress?: (progress: number, ev: ProgressEvent<EventTarget>) => any,
  headers?: Record<string, string>
) => {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = false;
    xhr.responseType = responseType;

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        resolve(xhr.response);
      }
    };

    xhr.onerror = reject;

    if (onProgress) {
      xhr.onprogress = ev => onProgress!(ev.loaded / ev.total, ev);
    }

    xhr.open('get', url);
    // xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    if (headers) {
      Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));
    }

    xhr.send();
  });
};
