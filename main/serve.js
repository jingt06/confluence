// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

global.FOAM_FLAGS = {gcloud: true};
require('foam2');
require('../lib/confluence/browser_history.es6');
require('../lib/web_apis/browser_api.es6');
require('../lib/web_apis/api_importer.es6');
require('../lib/web_catalog/api_extractor.es6');
require('../lib/confluence/api_velocity.es6');
require('../lib/confluence/browser_data_point.es6');
require('../lib/confluence/failure_to_ship.es6');
require('../lib/confluence/vendor_specific_api.es6');
require('../lib/confluence/aggressive_removal.es6');
require('../lib/confluence/removed_api.es6');

const objectGraph = require('object-graph-js').ObjectGraph;
const fs = require('fs');
const OG_DATA_PATH = `${__dirname}/../data`;

let extractor = org.chromium.apis.web.apiExtractor.create({});
let apiImporter = org.chromium.apis.web.ApiImporter.create({});

let server = foam.net.node.Server.create({
  port: 9000,
});

server.exportFile('/', `${__dirname}/../static/index.html`);

// let cloudDAO = com.google.cloud.datastore.DatastoreDAO.create({
//   of: org.chromium.apis.web.BrowserAPI,
//   protocol: 'http',
//   host: 'localhost',
//   port: 8888,
//   projectId: 'object-graph-test',
// });

// Use object graph data from ../data directory for demo
// before datastoreDAO is able to use.
let ogFiles = fs.readdirSync(OG_DATA_PATH);

for (let i = 0; i < ogFiles.length; i += 1) {
  console.log(`read object graph file ${ogFiles[i]}`);
  let filePath = `${OG_DATA_PATH}/${ogFiles[i]}`;
  let stat = fs.statSync(filePath);
  if (stat.isFile()) {
    let browserInfo = ogFiles[i].slice(0, -5).split('_');
    if (browserInfo[0] !== 'window') continue;
    apiImporter.import(browserInfo[1], browserInfo[2], browserInfo[3],
      browserInfo[4], extractor.extractWebCatalog(objectGraph
      .fromJSON(JSON.parse(fs.readFileSync(filePath)))));
  }
}

let aggressiveRemoval = org.chromium.apis.web.AggressiveRemoval
  .create({browserApiDAO: apiImporter.browserAPIs});

let apiVelocty = org.chromium.apis.web.ApiVelocty.create(
  {browserApiDAO: apiImporter.browserAPIs});

let failureToShip = org.chromium.apis.web.FailureToShip.create(
  {browserApiDAO: apiImporter.browserAPIs});

let vendorSpecificApi = org.chromium.apis.web.VendorSpecificApi.create(
  {browserApiDAO: apiImporter.browserAPIs});

server.exportDAO(failureToShip.failureToShipDAO, '/failureToShip');

server.exportDAO(vendorSpecificApi.vendorSpecificDAO, '/vendorSpecific');

server.exportDAO(apiVelocty.apiVelocityDAO, '/apiVelocity');

server.exportDAO(aggressiveRemoval.aggressiveRemovalDAO, '/aggressiveRemoval');

server.exportDAO(apiImporter.browserAPIs, '/browserAPIs');

server.exportDirectory('/images', `${__dirname}/../static/images`);

server.exportDirectory('/', `${__dirname}/../static/bundle`);

server.start();
