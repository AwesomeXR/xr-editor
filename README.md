# XR Editor

![workflow](https://github.com/AwesomeXR/xr-editor/actions/workflows/ci.yml/badge.svg)

![](https://rshop.tech/gw/assets/upload/202308292230998.png)

一个开源的 3D 编辑器。

- 基于 Babylon.js、React 和 antd
- 可外部扩展的面板系统
- 内建 H5、apng 导出功能

## 在项目中使用

```
npm install xr-editor
```

```jsx
import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IBuiltinWBKeyItem, XREditor, XRProjectModel, XRSetup, UserLevelEnum } from 'xr-editor';
import XRRuntimeStartupManifest from 'xr-editor/esm/XRRuntimeStartup.manifest.json';
import { ExternalImpl, MemoryFS } from 'ah-memory-fs';
import { IndexedDBAdapter } from 'ah-memory-fs-indexed-db';

ExternalImpl.ArrayBufferToString = data => new TextDecoder().decode(data);
ExternalImpl.StringToArrayBuffer = data => new TextEncoder().encode(data);

XRSetup();


export const EntryApp = () => {
  const ctx = useContext(AppContext);

  const [ready, setReady] = useState<boolean>(false);
  const projectRef = useRef<XRProjectModel>();

  useEffect(() => {
    launch();

    return () => {
      projectRef.current?.dispose();
    };
  }, []);

  const launch = async () => {
    const attachTo = 'XR-PLAYGROUND';
    const mfs = await MemoryFS.create(() => IndexedDBAdapter.attach(attachTo));

    const _uploadDist = async (data: Blob, path: string) => {
      return ''; // 自定义 data 上传 URL
    };

    const _projModel = new XRProjectModel(mfs, XRRuntimeStartupManifest.js[0], _uploadDist);
    await _projModel.reload();

    projectRef.current = _projModel;
    setReady(true);
  };


  return ready && projectRef.current ? (
    <>
      <XREditor
        style={{ width: '100vw', height: '100vh' }}
        project={projectRef.current}
      />
    </>
  ) : null;
};

ReactDOM.render(
  <EntryApp />,
  document.getElementById('__app')
);
```

## 本地启动

```bash
npm install
npm run app:dev
```