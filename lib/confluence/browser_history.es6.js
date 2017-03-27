// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

let fs = require('fs');

// TODO: Is there a way to make a singleton class in Foam?
foam.CLASS({
  name: 'BrowserHistory',
  package: 'org.chromium.apis.web',
  documentation: `BrowserHistory is a class that stores official release
    dates for each browsers and versions. It has methods to obtain
    release date for a given browser and version.`,
  properties: [
    {
      name: 'historyFilePath',
      class: 'String',
      final: true,
      value: `${__dirname}/../../data/browser_history.json`,
    },
    {
      name: 'browserHistory',
      documentation: `JSON of the form:
        {browserName: {versionNumber: releaseDate ...} ...}`,
    },
  ],
  methods: [
    {
      name: 'init',
      documentation: `The init function reads browser history form
        the historyFilePath.`,
      code: function() {
        let browserHistory = JSON.parse(fs.readFileSync(this.historyFilePath));
        for (let browserName in browserHistory) {
          if (!browserHistory.hasOwnProperty(browserName)) continue;
          for (let versionNumber in browserHistory[browserName]) {
            if (!browserHistory[browserName].hasOwnProperty(versionNumber)) {
              continue;
            }
            browserHistory[browserName][versionNumber] =
              new Date (browserHistory[browserName][versionNumber]);
          }
        }
        this.browserHistory = browserHistory;
      },
    },
    {
      name: 'getReleaseDate',
      documentation: `Find the release date for a given browser and version.`,
      args: [
        {
          name: 'browserkey',
          typeName: 'String',
          documentation: 'A string of valid browser key',
        },
      ],
      returns: {
        typeName: 'Date',
        documentation: 'The release date of the given browser version.',
      },
      code: function(browserKey) {
        let browserInfo = browserKey.split('_');
        let browserName = browserInfo[0];
        let browserVersion = browserInfo[1];
        if (!this.browserHistory.hasOwnProperty(browserName)) {
          throw new Error(`${browserName} not found in browser history`);
        }
        let versionHistory = this.browserHistory[browserName];
        // Because the JSON from browser_history.json only stores
        // major version number.
        for (let version in versionHistory) {
          if (!versionHistory.hasOwnProperty(version)) continue;
          if (browserVersion.indexOf(version) === 0) {
            return new Date(versionHistory[version].getTime());
          }
        }
        throw new Error(`${browserKey} not found in browser history`);
      },
    },
  ],
});
