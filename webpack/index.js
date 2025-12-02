const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: isDevelopment ? '[name].js' : '[name].[contenthash].js',
    publicPath: process.env.PUBLIC_PATH || '/',
    clean: true
  },
  devtool: isDevelopment ? 'eval-source-map' : 'source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, '../dist'),
    },
    compress: true,
    port: process.env.PORT || 8080,
    hot: true,
    historyApiFallback: true,
    open: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ]
      },
      {
        test: /\.s[ac]ss$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8kb
          }
        },
        generator: {
          filename: 'images/[name].[hash][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash][ext]'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      minify: !isDevelopment ? {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      } : false
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.PUBLIC_PATH': JSON.stringify(process.env.PUBLIC_PATH || '/')
    }),
    ...(isDevelopment ? [
      new webpack.HotModuleReplacementPlugin()
    ] : [
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
        chunkFilename: '[id].[contenthash].css'
      }),
      new FaviconsWebpackPlugin({
        logo: './src/assets/logo.png',
        cache: true,
        inject: true,
        favicons: {
          appName: 'React App',
          appDescription: 'React application',
          developerName: 'Developer',
          background: '#fff',
          theme_color: '#333',
          icons: {
            android: true,
            appleIcon: true,
            appleStartup: true,
            coast: false,
            favicons: true,
            firefox: true,
            windows: true,
            yandex: false
          }
        }
      }),
      new WorkboxPlugin.GenerateSW({
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5000000
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: 'bundle-report.html'
      })
    ])
  ],
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          chunks: 'all'
        }
      }
    }
  },
  performance: {
    hints: isDevelopment ? false : 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  }
};
