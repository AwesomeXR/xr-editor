import React, { useContext } from 'react';
import { Button, Typography, Upload, UploadProps, Image } from 'antd';
import Path from 'path';
import { DeleteOutlined } from '@ant-design/icons';
import { IXREditorContext, XREditorContext } from '../../XREditorContext';
import ImgCrop from 'antd-img-crop';
import { readBlob } from '../../../common/lib/readBlob';
import { md5 } from 'ah-pure-md5';
import { FileExplorer } from '../BizField/FileExplorer';
import { RcFile } from 'antd/es/upload';
import { isFile } from '../../TypeUtil';
export interface IAssetsUploaderProps {
  className?: string;
  style?: React.CSSProperties;

  accept?: string;
  enableImgCrop?: { aspect?: number };

  disableMfsUpload?: boolean;

  value?: string;
  onChange?: (value: string) => any;
}

export const AssetsUploader = ({
  className,
  style,
  accept,
  value,
  onChange,
  enableImgCrop,
  disableMfsUpload,
}: IAssetsUploaderProps) => {
  const ctx = useContext(XREditorContext);
  const isOnlyAcceptImage = accept ? !!(accept.match(/\.(jpg|jpeg|png|gif)$/) || accept.startsWith('image/')) : false;

  const baseUploadDraggerNode = (
    <Upload.Dragger
      accept={accept}
      onChange={info => info.file?.response?.url && onChange?.(info.file.response.url)}
      customRequest={createCustomRequest(ctx)}
      style={{ maxWidth: 300 }}
    >
      点击或拖入此处上传
    </Upload.Dragger>
  );

  const MFSUploadNode = !disableMfsUpload ? (
    <MFSUpload onChange={info => info.file?.response?.url && onChange?.(info.file.response.url)} />
  ) : null;

  return (
    <div data-name='AssetsUploader' className={className} style={style}>
      {value ? (
        <>
          {value.toLocaleLowerCase().match(/\.(jpg|jpeg|png|gif)$/) && (
            <Image
              src={value}
              style={{ display: 'block', objectFit: 'contain', width: '100%', aspectRatio: '1', background: '#f6f6f6' }}
            />
          )}
          <div style={{ display: 'flex' }}>
            <Typography.Link ellipsis href={value} title={value} target='_blank' style={{ width: 1, flex: 1 }}>
              {value}
            </Typography.Link>
            <Button size='small' type='text' danger icon={<DeleteOutlined />} onClick={() => onChange?.('')} />
          </div>
        </>
      ) : isOnlyAcceptImage && enableImgCrop ? (
        <div>
          {MFSUploadNode && (
            <ImgCrop
              quality={1}
              showReset
              modalTitle='编辑图片'
              {...(enableImgCrop.aspect ? { aspect: enableImgCrop.aspect } : { aspectSlider: true })}
            >
              {MFSUploadNode}
            </ImgCrop>
          )}

          <ImgCrop
            quality={1}
            showReset
            modalTitle='编辑图片'
            {...(enableImgCrop.aspect ? { aspect: enableImgCrop.aspect } : { aspectSlider: true })}
          >
            {baseUploadDraggerNode}
          </ImgCrop>
        </div>
      ) : (
        <div>
          {MFSUploadNode}
          {baseUploadDraggerNode}
        </div>
      )}
    </div>
  );
};

const createCustomRequest = (ctx: IXREditorContext) => {
  return async (opt: Parameters<Required<UploadProps>['customRequest']>[0]) => {
    const file = opt.file as File;
    try {
      const md5Str = await readBlob(file, 'BinaryString').then(bs => md5(bs));
      const path = md5Str + Path.extname(file.name);

      const url = await ctx.project.uploadDist(file, path);

      opt.onSuccess?.({ url });
    } catch (err) {
      opt.onError?.(err as any);
      throw err;
    }
  };
};

const MFSUpload = ({ beforeUpload, onChange }: UploadProps) => {
  const ctx = useContext(XREditorContext);

  const handleFileChange = async (filepath: string) => {
    const buf = await ctx.project.mfs.readFile(filepath);
    const file = new File([buf], 'image/png') as RcFile;
    const croppedFile = await beforeUpload?.(file, [file]);
    if (!isFile(croppedFile)) return;

    const md5Str = await readBlob(file, 'BinaryString').then(bs => md5(bs));
    const path = md5Str + Path.extname(filepath);
    const distURL = await ctx.project.uploadDist(croppedFile!, path);
    onChange?.({ file: { response: { url: distURL }, uid: 'uid', name: filepath }, fileList: [] });
  };

  return (
    <FileExplorer style={{ marginBottom: 10 }} onChange={handleFileChange} acceptExts={['.jpg', '.jpeg', '.png']} />
  );
};
