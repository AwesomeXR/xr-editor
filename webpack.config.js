const path = require('path');
const { Logger } = require('ah-logger');
const webpack = require('webpack');
const { version } = require('./package.json');
const TerserPlugin = require('terser-webpack-plugin');
const logger = new Logger('webpack.config');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const _ = require('lodash');
// const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const AntdMapToken = require('./src/ThemeToken.json');
const dotenv = require('dotenv');

// 读取 .env 文件
dotenv.config();

const ENV = process.env;
ENV.version = version;

logger.info(`ENV -> \n${JSON.stringify(ENV, null, 2)}`);

const config = {
  module: {
    rules: [
      {
        test: /\.worker\.ts$/,
        use: [{ loader: 'worker-loader', options: { inline: 'fallback' } }],
      },
      {
        // 处理: BREAKING CHANGE: The request 'process/browser' failed to resolve only because it was resolved as fully specified
        test: /\.m?js/,
        resolve: { fullySpecified: false },
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: ENV.MODE === 'development' ? 'tsconfig.json' : 'tsconfig.build.json',
            },
          },
        ],
      },
      { test: /\.svg$/, use: ['svg-react-loader'] },
      {
        test: /\.(css|less)$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'less-loader',
            options: {
              lessOptions: { javascriptEnabled: true, strictMath: false, modifyVars: AntdMapToken },
            },
          },
        ],
      },
      {
        test: /\.(env|dds|png|jpg|zip|babylon|vol|hdr|d\.ts)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(xml)$/i,
        type: 'asset/source', // 导入为文本
      },
      {
        test: /\.js$/,
        loader: 'string-replace-loader',
        options: {
          multiple: [
            // fix: [[Bug] marked.Renderer is not a constructor · Issue #3035 · microsoft/monaco-editor](https://github.com/microsoft/monaco-editor/issues/3035)
            {
              search: '(__marked_exports || exports)',
              replace: `(typeof exports !== 'undefined' ? exports : __marked_exports)`,
            },
            // 去掉 antd button 的 wave 效果(性能考虑)
            {
              search: 'function isUnBorderedButtonType(type) {',
              replace: `function isUnBorderedButtonType(type) { return true;`,
            },
          ],
        },
      },
    ],
  },

  output: {
    library: { type: 'umd', name: ['XR', '[name]'] },
  },

  externals: {
    react: { root: 'React', commonjs2: 'react', commonjs: 'react', amd: 'react' },
    'react-dom': {
      root: 'ReactDOM',
      commonjs2: 'react-dom',
      commonjs: 'react-dom',
      amd: 'react-dom',
    },
    'react-dom/server': {
      root: 'ReactDOMServer',
      commonjs2: 'react-dom/server',
      commonjs: 'react-dom/server',
      amd: 'react-dom/server',
    },
    lodash: { root: '_', commonjs2: 'lodash', commonjs: 'lodash', amd: 'lodash' },
    // antd: 'antd', 和 XUI alias 冲突
    typescript: { root: 'ts', commonjs2: 'typescript', commonjs: 'typescript', amd: 'typescript' },
    'ali-oss': { root: 'OSS', commonjs2: 'ali-oss', commonjs: 'ali-oss', amd: 'ali-oss' },
    codemirror: { root: 'CodeMirror', commonjs2: 'codemirror', commonjs: 'codemirror', amd: 'codemirror' },
    dayjs: { root: 'dayjs', commonjs2: 'dayjs', commonjs: 'dayjs', amd: 'dayjs' },
  },

  plugins: [
    new webpack.DefinePlugin({
      ..._.mapValues(ENV, v => JSON.stringify(v)),
    }),

    // [Won’t work in browser because of process.cwd()? · Issue #8 · browserify/path-browserify](https://github.com/browserify/path-browserify/issues/8)
    new webpack.ProvidePlugin({ process: 'process/browser' }),
    // new MonacoWebpackPlugin({ languages: ['javascript', 'typescript', 'css', 'html', 'json'] }),
  ],

  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      crypto: false,
      fs: false,
      path: require.resolve('path-browserify'),
      buffer: require.resolve('buffer'),
    },
    alias: {
      antd$: path.resolve(__dirname, 'src/common/component/XUI/index.ts'),

      // 处理本地开发时 npm link 软连接造成 ah-flow-node 等加载多份的问题
      'xr-core$': path.resolve(__dirname, 'node_modules/xr-core'),
      'ah-flow-node$': path.resolve(__dirname, 'node_modules/ah-flow-node'),
    },
  },

  stats: {
    // warningsFilter: /export .* was not found in/,
    errorDetails: true,
  },

  optimization: {
    minimize: ENV.MODE == 'production',
    splitChunks: { chunks: 'async', minChunks: 1 },
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: { drop_debugger: true },
        },
      }),
    ],
  },
};

module.exports = { config, ENV, logger };
