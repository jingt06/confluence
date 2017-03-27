// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

foam.CLASS({
  name: 'VersionDiff',
  package: 'org.chromium.apis.web',
  documentation: `VersionDiff contains the numer of total APIs,
    new APIs and removed APIs compared to the previous version
    of this browser version.`,
  ids: ['browserName', 'browserVersion', 'osName', 'osVersion'],
  properties: [
    {
      class: 'Date',
      name: 'releaseDate',
      documentation: `The official release date for this browser version.`,
      required: true,
      final: true,
    },
    {
      class: 'String',
      name: 'browserName',
      documentation: `Name of the browser.`,
      required: true,
      final: true,
    },
    {
      class: 'String',
      name: 'browserVersion',
      documentation: `Version of the browser.`,
      required: true,
      final: true,
    },
    {
      class: 'String',
      name: 'osName',
      documentation: `The name of operating system as reported by the
        object-graph-js library.`,
      required: true,
      final: true,
    },
    {
      class: 'String',
      name: 'osVersion',
      documentation: `The version of operating system as reported by the
        object-graph-js library.`,
      required: true,
      final: true,
    },
    {
      class: 'Int',
      name: 'totalApis',
      documentation: `The number of total Apis in this
        version of browser.`,
      required: true,
      final: true,
    },
    {
      class: 'Int',
      name: 'newApis',
      documentation: `The number of new APIs compared
        to the previous release.`,
      required: true,
      final: true,
    },
    {
      class: 'Int',
      name: 'removedApis',
      documentation: `The number of removed APIs compared
        to the previous release.`,
      required: true,
      final: true,
    },
    {
      name: 'prevBrowserKey',
      documentation: `An unique key for this browser of previous release.
        Value is null if no previous release.`,
      required: true,
      final: true,
    },
    {
      class: 'String',
      name: 'browserKey',
      documentation: `An unique key for this browser. Avoid the need for
        CONCAT mLang or similar to be able to groupBy browserName,
        browserVersion, osName, osVersion.`,
      expression: function(browserName, browserVersion, osName, osVersion) {
        return`${browserName}_${browserVersion}_${osName}_${osVersion}`;
      },
    },
    {
      class: 'String',
      name: 'browserNameOsName',
      documentation: `Avoid the need for CONCAT mLang or similar to
        be able to groupBy browserName and osName.`,
      expression: function(browserName, osName) {
        return`${browserName}_${osName}`;
      },
    },
  ],
});
