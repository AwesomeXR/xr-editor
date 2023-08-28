import React, { useContext } from 'react';
import { Button, Typography, Upload, UploadProps, Image } from 'antd';
import Path from 'path';
import { CloudUploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { IXREditorContext, XREditorContext } from '../../XREditorContext';
import ImgCrop from 'antd-img-crop';
import { readBlob } from '../../../common/lib/readBlob';
import { md5 } from 'ah-pure-md5';

export interface IImageUploaderProps {
  className?: string;
  style?: React.CSSProperties;

  previewWidth?: string | number;
  enableImgCrop?: { aspect?: number };

  value?: string;
  onChange?: (value: string) => any;
}

export const ImageUploader = ({
  className,
  style,
  previewWidth,
  value,
  onChange,
  enableImgCrop,
}: IImageUploaderProps) => {
  const ctx = useContext(XREditorContext);

  const wrapImgCropIfNeeded = (ele: any) => {
    if (!enableImgCrop) return ele;

    return (
      <ImgCrop
        quality={1}
        showReset
        modalTitle='编辑图片'
        {...(enableImgCrop.aspect ? { aspect: enableImgCrop.aspect } : { aspectSlider: true })}
      >
        {ele}
      </ImgCrop>
    );
  };

  return (
    <div data-name='ImageUploader' className={className} style={style}>
      {value ? (
        <>
          <Image
            src={value}
            width={previewWidth || '100%'}
            style={{ display: 'block', objectFit: 'contain', width: '100%', background: '#f6f6f6' }}
          />
          <div style={{ display: 'flex' }}>
            {wrapImgCropIfNeeded(
              <Upload
                accept='image/*'
                showUploadList={false}
                onChange={info => info.file?.response?.url && onChange?.(info.file.response.url)}
                customRequest={createCustomRequest(ctx)}
              >
                <Button size='small' icon={<CloudUploadOutlined />}>
                  重新上传
                </Button>
              </Upload>
            )}
            <Button size='small' icon={<DeleteOutlined />} onClick={() => onChange?.('')} style={{ marginLeft: 8 }}>
              清除
            </Button>
          </div>
        </>
      ) : (
        wrapImgCropIfNeeded(
          <Upload.Dragger
            accept='image/*'
            showUploadList={false}
            onChange={info => info.file?.response?.url && onChange?.(info.file.response.url)}
            customRequest={createCustomRequest(ctx)}
            style={{ maxWidth: 300 }}
          >
            点击或拖入此处上传
          </Upload.Dragger>
        )
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
