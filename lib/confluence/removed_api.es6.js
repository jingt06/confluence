// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

foam.CLASS({
  name: 'RemovedAPI',
  package: 'org.chromium.apis.web',
  documentation: ``,
  ids: ['browserKey'],
  properties: [
    {
      class: 'String',
      name: 'browserKey',
      documentation: `An unique key for this browser.`,
      required: true,
      final: true,
    },
    {
      class: 'String',
      name: 'browserName',
      documentation: 'Name of the Browser',
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
      class: 'StringArray',
      name: 'comparedBrowserKeys',
      documentation: `BrowserKeys for other browsers and versions
        that released in one year range of this browser version's
        release.`,
      required: true,
      final: true,
    },
    {
      name: 'prevBrowserKey',
      documentation: `BrowserKey of this browser and version of
        previous version of this browser. Value is null if no
        previous version.`,
      required: true,
      final: true,
    },
    {
      class: 'Date',
      name: 'releaseDate',
      documentation: 'The release date of this browser.',
      required: true,
      final: true,
    },
    {
      class: 'Int',
      name: 'aggressiveRemoval',
      documentation: 'The number of APIs.',
      required: true,
      final: true,
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
