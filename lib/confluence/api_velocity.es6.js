// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

require('./version_diff.es6');

foam.CLASS({
  name: 'ApiVelocty',
  package: 'org.chromium.apis.web',
  documentation: `ApiVelocity is a class that computes the API
    Velocity metrics from browserAPIs DAO. It shows the total
    number of APIs, new APIs and remvoed APIs for each version
    of browser.`,
  requires: [
    'org.chromium.apis.web.BrowserAPI',
    'org.chromium.apis.web.VersionDiff',
    'org.chromium.apis.web.BrowserHistory',
    'foam.mlang.ExpressionsSingleton',
    'foam.dao.ArraySink',
    'foam.dao.EasyDAO',
  ],
  properties: [
    {
      name: 'browserApiDAO',
      documentation: `This is a DAO that contains BrowserAPIs.`,
      required: true,
      final: true,
    },
    {
      name: 'apiVelocityDAO',
      documentation: `This is a DAO that contains VersioNDiffs.`,
      final: true,
      factory: function() {
        let apiVelocityDAO = this.EasyDAO.create({
          name: 'apiVelocityDAO',
          of: this.BrowserAPI,
          daoType: 'MDAO',
        });
        apiVelocityDAO.addPropertyIndex(this.VersionDiff.BROWSER_NAME);
        apiVelocityDAO.addPropertyIndex(this.VersionDiff.BROWSER_NAME_OS_NAME);
        return apiVelocityDAO;
      },
    },
    {
      name: 'mlang',
      documentation: `Object contains mlang expressions, it supports
        logic operations such as AND and OR and math operations such
        as IN, EQ.`,
      factory: function() {
        return this.ExpressionsSingleton.create();
      },
    },
    {
      name: 'browserHistory',
      documentation: `org.chromium.apis.web.BrowserHistory object.`,
      final: true,
      factory: function() {
        return this.BrowserHistory.create();
      },
    },
  ],
  methods: [
    {
      name: 'init',
      documentation: `The init function computes the API Velocity for
        each major browsers contained in the given browserApiDAO and
        store them in apiVelocityDAO.`,
      code: function() {
        this.browserApiDAO.orderBy(this.BrowserAPI.INTERFACE_KEY)
        .select(this.mlang.GROUP_BY(
          this.BrowserAPI.BROWSER_KEY,
          this.ArraySink.create()))
          .then((groups) => {
            let browserKeys = groups.groupKeys.sort();
            let browserGroups = {};
            for (let i = 0; i < browserKeys.length; i++) {
              let browserInfo = browserKeys[i].split('_');
              let browserName = browserInfo[0];
              if (!browserGroups.hasOwnProperty(browserName)) {
                browserGroups[browserName] = {};
              }
              let os = browserInfo[2];
              if (!browserGroups[browserName].hasOwnProperty(os)) {
                browserGroups[browserName][os] = [];
              }
              // we put browsers on the same operating system but
              // different OS version in the same groups. Since for
              // browsers like Safari, its version is associated to the
              // OS version.
              browserGroups[browserName][os].push(browserKeys[i]);
            }
            for (let browser in browserGroups) {
              if (!browserGroups.hasOwnProperty(browser)) continue;
              for (let os in browserGroups[browser]) {
                if (!browserGroups[browser].hasOwnProperty(os)) continue;
                for (let i = 0; i < browserGroups[browser][os].length; i++) {
                  let browserKey = browserGroups[browser][os][i];
                  let browserInfo = browserKey.split('_');
                  // newAPI and removed API is 0 for the first version in list.
                  if (i === 0) {
                    this.apiVelocityDAO.put(this.VersionDiff.create({
                      releaseDate: this.browserHistory
                        .getReleaseDate(browserKey),
                      browserName: browserInfo[0],
                      browserVersion: browserInfo[1],
                      osName: browserInfo[2],
                      osVersion: browserInfo[3],
                      totalApis: groups.groups[browserKey].a.length,
                      newApis: 0,
                      removedApis: 0,
                      prevBrowserKey: null,
                    }));
                    continue;
                  }
                  // Sice the groups[browserKey].a is an array sorted
                  // in the order of interfaceKey, so we can count the
                  // differences between two array of browserAPIs in
                  // in one loop.
                  let prevVersionKey = browserGroups[browser][os][i-1];
                  let prevVersionApis = groups.groups[prevVersionKey].a;
                  let currentApis = groups.groups[browserKey].a;
                  let curr = 0;
                  let prev = 0;
                  let newApis = 0;
                  let removedApis = 0;
                  while (prev < prevVersionApis.length
                    && curr < currentApis.length) {
                    if (prev === prevVersionApis.length) {
                      newApis += currentApis.length - curr;
                      break;
                    } else if (curr === currentApis.length) {
                      removedApis += prevVersionApis.length - prev;
                      break;
                    }
                    let compareResult = foam.Function.compare(
                      prevVersionApis[prev].interfaceKey,
                      currentApis[curr].interfaceKey);
                    if (compareResult === 0) {
                      prev++;
                      curr++;
                    } else if (compareResult === 1) {
                      // prev.interfaceKey > curr.interfaceKey
                      curr++;
                      newApis++;
                    } else if (compareResult === -1) {
                      // prev.interfaceKey < curr.interfaceKey
                      prev++;
                      removedApis++;
                    }
                  }
                  this.apiVelocityDAO.put(this.VersionDiff.create({
                    releaseDate: this.browserHistory
                      .getReleaseDate(browserKey),
                    browserName: browserInfo[0],
                    browserVersion: browserInfo[1],
                    osName: browserInfo[2],
                    osVersion: browserInfo[3],
                    totalApis: currentApis.length,
                    newApis,
                    removedApis,
                    prevBrowserKey: prevVersionKey,
                  }));
                }
              }
            }
          });
      },
    },
  ],
});
