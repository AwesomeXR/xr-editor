const path = require('path');
const wm = require('webpack-merge').default;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { config: baseConfig, logger, ENV } = require('./webpack.config');

const CWD = process.cwd();
const distDir = path.resolve(CWD, 'app/dist');
const port = 8081;

let config = wm({}, baseConfig, {
  mode: ENV.MODE,
  devtool: false,
  entry: {
    XRRuntimeStartup: './src/XRRuntimeStartup.ts',
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: `./src/manifest.json.ejs`,
      inject: false,
      filename: 'manifest.json',
    }),
  ],

  output: {
    filename: ENV.MODE === 'development' ? '[name].js' : '[name].[contenthash].js',
    publicPath: ENV.MODE === 'development' ? `http://localhost:${port}/` : '',
    path: distDir,
  },

  ...(ENV.MODE === 'development' && {
    devServer: {
      host: '0.0.0.0',
      allowedHosts: 'all',
      port: port,
      client: { progress: true, overlay: false },
      headers: {
        'Feature-Policy': 'camera *',
        'Access-Control-Allow-Origin': '*',
      },
    },
  }),
});

config = applyEntry('index')(config);

module.exports = config;

function applyEntry(name) {
  logger.info(`apply entry: ${name}`);

  // 同时生成 {name} 和 {name}.html 文件（兼容）
  const docFileNames = [name, name + '.html'];

  return cfg => {
    return wm(cfg, {
      entry: { [name]: `./demo/${name}.tsx` },
      plugins: [
        ...docFileNames.map(
          filename =>
            new HtmlWebpackPlugin({
              template: `./demo/${name}.ejs`,
              inject: false,
              chunks: [name],
              filename,
            })
        ),
      ],
    });
  };
}
