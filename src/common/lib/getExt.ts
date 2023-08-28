/** 获取后缀，含点号，例如 `.jpg` */
export function getExt(path: string): string | undefined {
  return (path.match(/(\.[^.\/]*?)$/) || [])[1];
}
