// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

const path = require('path');
const webpack = require('webpack');
const ChunkWebpack = webpack.optimize.CommonsChunkPlugin;

const ROOT_DIR = path.resolve(__dirname, '..');
const FOAM_DIR = path.resolve(__dirname, '../node_modules/foam2');
const BUNDLE_DIR = path.resolve(__dirname, '../static/bundle');

const execSync = require('child_process').execSync;
execSync(`node ${FOAM_DIR}/tools/build.js  web,gcloud`);
execSync(`mkdir -p ${ROOT_DIR}/static/bundle`);
execSync(`mv ${FOAM_DIR}/foam-bin.js ${ROOT_DIR}/static/bundle/foam.bundle.js`);

module.exports = {
  entry: {
    app: [path.resolve(ROOT_DIR, 'main/app.es6')],
  },
  output: {
    filename: '[name].bundle.js',
    path: BUNDLE_DIR,
  },
  module: {
    loaders: [
      {
        test: /\.es6\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime'],
        },
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
    ],
  },
  plugins: [
    new ChunkWebpack({
      filename: 'vendors.bundle.js',
      minChunks: Infinity,
      name: 'vendors',
    }),
  ],
  resolve: {
    extensions: ['.js'],
  },
  node: {
    fs: 'empty',
    dns: 'empty',
  },
};
