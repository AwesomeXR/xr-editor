# XR Editor

![workflow](https://github.com/AwesomeXR/xr-editor/actions/workflows/ci.yml/badge.svg)

![](https://rshop.tech/gw/assets/upload/202308292230998.png)
![](https://rshop.tech/gw/assets/upload/202308292258070.png)

一个开源的 3D 编辑器。

- 基于 [Babylon.js](https://www.babylonjs.com/)、React 和 antd
- 可外部扩展的面板系统
- 内建 H5、apng 导出功能

## 在项目中使用

参见示例：[demo/page/XREdtiroPage.tsx](demo/page/XREdtiroPage.tsx)

- 扩展面板：参见 [src/xr/BuiltinExtension/ModelDesignOutline](src/xr/BuiltinExtension/ModelDesignOutline)

## 本地启动

```bash
npm install
npm run app:dev
```