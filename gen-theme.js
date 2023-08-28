const antd = require('antd');
const fs = require('fs');

/** @type { import('antd/es/theme/internal').SeedToken} */
const SeedToken = {
  ...antd.theme.defaultSeed,
  colorBgBase: '#1D1D1D',
};

const AntdMapToken = antd.theme.darkAlgorithm(SeedToken);

fs.writeFileSync('./src/ThemeToken.json', JSON.stringify(AntdMapToken, null, 2), 'utf-8');
