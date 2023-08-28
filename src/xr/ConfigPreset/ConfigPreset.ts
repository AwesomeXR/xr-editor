import _ from 'lodash';
import { getInternalRandomString } from '../../common';
import { IXREditorConfig } from '../IXREditorConfig';

const _configMap = {
  default: require('./default.json') as IXREditorConfig,
};

export function ConfigPreset(name: keyof typeof _configMap): IXREditorConfig {
  const config = _.cloneDeep(_configMap[name]);
  config.name = getInternalRandomString(); // 需要重设 name
  return config;
}
