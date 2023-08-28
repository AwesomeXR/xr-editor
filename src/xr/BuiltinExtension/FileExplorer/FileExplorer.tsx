import React, { useContext } from 'react';
import { usePanelModel } from '../../hook/usePanelModel';
import { ProgressHelper, useFWHeaderSlot, useForceUpdate, useListen } from '../../../common';
import { XREditorContext } from '../../XREditorContext';
import { Header } from './Header';
import { LightTree } from '../../../common/component/LightTree';
import { FileExplorerModel } from './FileExplorerModel';
import { Spin } from 'antd';

export interface IFileExplorerProps {
  className?: string;
  style?: React.CSSProperties;
}

export const FileExplorer = ({ className, style }: IFileExplorerProps) => {
  const fu = useForceUpdate();
  const ctx = useContext(XREditorContext);
  const headerSlot = useFWHeaderSlot();
  const model = usePanelModel<FileExplorerModel>('FileExplorer');

  useListen(model.event, 'afterStateChange', fu.update);

  return (
    <>
      {headerSlot(<Header model={model} />)}
      <div
        data-name='FileExplorer'
        className={className}
        style={{ position: 'relative', height: '100%', width: '100%', ...style }}
        onDragOver={ev => ev.preventDefault()}
        onDrop={ev => model.handleFileDrop(ev)}
      >
        <Spin
          spinning={!!model.state.fileImporting}
          size='small'
          tip={
            '正在导入' +
            (model.state.fileImporting?.progress && ProgressHelper.format(model.state.fileImporting.progress))
          }
        >
          {model.state.displayType === 'List' ? (
            <FileExplorer.ListContent model={model} />
          ) : (
            <FileExplorer.GridContent model={model} />
          )}
        </Spin>
      </div>
    </>
  );
};

FileExplorer.ListContent = ({ model }: { model: FileExplorerModel }) => {
  return <LightTree model={model.outline} />;
};

FileExplorer.GridContent = ({ model }: { model: FileExplorerModel }) => {
  return null;
};
