import { AutoCleaner } from './AutoCleaner';

// 发起浏览器下载文件
export function browserDownload(file: File) {
  const url = URL.createObjectURL(file);

  const a = document.createElement('a');
  a.download = file.name;
  a.href = url;

  AutoCleaner.register(a, () => URL.revokeObjectURL(url), url);

  a.click();
}
