'use strict';

const _ = require('lodash');
const webpack = require('webpack');


const FOAM_DIR = `${__dirname}/../node_modules/foam2`;

const execSync = require('child_process').execSync;

execSync(`node ${FOAM_DIR}/tools/build.js web`);

const entries = [
  {inDir: 'web_catalog', name: 'api_extractor.es6'},
  {inDir: '../test/any/web_catalog', name: 'api-extractor-integration.es6'},
  {inDir: '../test/any/web_catalog', name: 'api-extractor-test.es6'},
  {inDir: '../node_modules/foam2', name: 'foam-bin'},
];

const isExternal = (module) => {
  const userRequest = module.userRequest;

  if (typeof userRequest !== 'string') {
    return false;
  }

  return userRequest.indexOf('bower_components') >= 0 ||
    userRequest.indexOf('node_modules') >= 0 ||
    userRequest.indexOf('libraries') >= 0;
};

module.exports = {
  context: __dirname,
  entry: _.zipObject(
    entries.map(e => e.name),
    entries.map(e => `${__dirname}/../lib/${e.inDir}/${e.name}.js`)
  ),
  output: {
    path: `./static/bundle`,
    filename: '[name].bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.es6\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime']
        },
      },
    ],
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendors',
      minChunks: function(module) {
        return isExternal(module);
      },
    }),
  ],
  node: {
    fs: 'empty',
    dns: 'empty',
  },
};
