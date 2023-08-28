import { Button, Modal, message } from 'antd';
import React, { useContext, useState } from 'react';
import { IFileDropInfo } from '../ViewModel';
import { XREditorContext } from '../XREditorContext';
import { useListen } from '../../common';

export interface IWorkbenchFileDropLayerProps {
  className?: string;
  style?: React.CSSProperties;
}

export const WorkbenchFileDropLayer = ({ className, style }: IWorkbenchFileDropLayerProps) => {
  const ctx = useContext(XREditorContext);

  const [fileInfo, setFileInfo] = useState<{ info: IFileDropInfo; gltfPath?: string }>();
  const [modalOpen, setModalOpen] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>();

  useListen(ctx.project.event, 'scene:afterFileDrop', ev => {
    const gltfItem = ev.statsList.find(item => item.path.match(/\.(glb|gltf)$/i));
    if (!gltfItem) {
      message.warning('当前仅支持导入 GLB/GLTF 文件');
      return;
    }

    setFileInfo({ info: ev, gltfPath: gltfItem.path });
    setModalOpen(true);
  });

  const scene = ctx.project.activeScene;
  if (!scene) return null;

  const handleOk = async () => {
    if (!fileInfo) return;

    const { gltfPath, info } = fileInfo;
    if (!gltfPath) return;

    setLoading(true);

    return scene
      .importGLTF(info.mfs, gltfPath)
      .then(() => setModalOpen(false))
      .finally(() => setLoading(false));
  };

  const renderContent = () => {
    if (!fileInfo) return null;

    const { gltfPath } = fileInfo;

    return (
      <div className={className} style={style}>
        <span>已读取 “{gltfPath}”</span>
      </div>
    );
  };

  return (
    <Modal
      open={modalOpen}
      destroyOnClose
      width={600}
      onCancel={() => setModalOpen(false)}
      onOk={handleOk}
      confirmLoading={loading}
      okText={'导入到场景'}
    >
      {renderContent()}
    </Modal>
  );
};
