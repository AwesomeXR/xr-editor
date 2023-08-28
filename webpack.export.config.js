const path = require('path');
const wm = require('webpack-merge').default;
const { config: baseConfig, logger, ENV } = require('./webpack.config');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const CWD = process.cwd();
const distDir = path.resolve(CWD, 'dist');

let config = wm({}, baseConfig, {
  mode: ENV.MODE,
  devtool: false,
  entry: {},

  output: {
    filename: '[name].[contenthash].js',
    publicPath: ENV.ASSETS_PREFIX,
    path: distDir,
  },

  // FIXME: 生产环境一定要注释掉
  // optimization: {
  //   minimize: false,
  // },
});

config = applyEntry('index')(config);
config = applyEntry('XRRuntimeStartup')(config);

function applyEntry(name) {
  logger.info(`apply entry: ${name}`);

  return cfg => {
    return wm(cfg, {
      entry: { [name]: `./src/${name}.ts` },
      plugins: [
        // 生成 esm 入口
        new HtmlWebpackPlugin({
          template: `./src/index.ts.ejs`,
          filename: path.resolve(CWD, `esm/${name}.js`),
          inject: false,
          chunks: [name],
        }),
        // 生成 manifest
        new HtmlWebpackPlugin({
          template: `./src/manifest.json.ejs`,
          filename: path.resolve(CWD, `esm/${name}.manifest.json`),
          inject: false,
          chunks: [name],
        }),
      ],
    });
  };
}

module.exports = config;
