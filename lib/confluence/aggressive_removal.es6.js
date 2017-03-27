// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

foam.CLASS({
  name: 'AggressiveRemoval',
  package: 'org.chromium.apis.web',
  documentation: ``,
  requires: [
    'org.chromium.apis.web.BrowserAPI',
    'org.chromium.apis.web.failureToShip',
    'org.chromium.apis.web.BrowserHistory',
    'org.chromium.apis.web.RemovedAPI',
    'foam.mlang.ExpressionsSingleton',
    'foam.dao.ArraySink',
    'foam.mlang.sink.Count',
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
      name: 'aggressiveRemovalDAO',
      documentation: `This should be a DAO that contains BrowserDataPoints.`,
      final: true,
      factory: function() {
        return this.EasyDAO.create({
          name: 'removedApiDAO',
          of: this.RemovedAPI,
          daoType: 'MDAO',
        });
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
      documentation: ``,
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
              // We put browsers on the same operating system but
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
                  let releaseDate = this.browserHistory
                    .getReleaseDate(browserKey);
                  // aggresive removal is 0 for the first version in list.
                  if (i === 0) {
                    this.aggressiveRemovalDAO.put(this.RemovedAPI.create({
                      releaseDate,
                      browserKey,
                      prevBrowserKey: null,
                      comparedBrowserKeys: [],
                      browserName: browserInfo[0],
                      browserVersion: browserInfo[1],
                      osName: browserInfo[2],
                      aggressiveRemoval: 0,
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
                  let removedInterfaceKey = [];
                  let currInterfaceKeyDict = {};
                  for (let i = 0; i < currentApis.length; i++) {
                    currInterfaceKeyDict[
                      currentApis[i].interfaceKey] = true;
                  }
                  for (let i = 0; i < prevVersionApis.length; i++) {
                    // A browserAPI is removed if it exists in the
                    // previous version but not current version.
                    if (!currInterfaceKeyDict
                      .hasOwnProperty(prevVersionApis[i].interfaceKey)) {
                        removedInterfaceKey.push(prevVersionApis[i].interfaceKey);
                    }
                  }
                  let releaseYear = releaseDate.getFullYear();
                  let releaseMonth = releaseDate.getMonth();
                  let releaseDay = releaseDate.getDate();
                  let nextYear = new Date(releaseYear + 1,
                    releaseMonth, releaseDay);
                  // TODO: use 2 table relational model will make
                  // this step eaiser.
                  this.browserApiDAO
                  .where(this.mlang.AND(
                    this.mlang.LT(this.BrowserAPI.RELEASE_DATE, nextYear),
                    this.mlang.GT(this.BrowserAPI.RELEASE_DATE, releaseDate),
                    this.mlang.NEQ(this.BrowserAPI.BROWSER_NAME, browser)))
                  .orderBy(this.BrowserAPI.RELEASE_DATE)
                  .select(this.mlang.GROUP_BY(this.BrowserAPI.BROWSER_KEY,
                    this.Count.create()))
                  .then((groups) => {
                    let recentReleasedBrowsers = groups.groupKeys;
                    let browserDict = {};
                    for (let i = 0; i < recentReleasedBrowsers.length; i++) {
                      let browserName = recentReleasedBrowsers[i].split('_')[0];
                      // The recentReleasedBrowsers is sorted by release Date
                      // so the older version key will be overwritten by
                      // newer version.
                      browserDict[browserName] = recentReleasedBrowsers[i];
                    }
                    let nextReleaseBrowserKeys =
                    Object.keys(browserDict)
                      .map((browserName) => {
                        return browserDict[browserName];
                      });
                    if (nextReleaseBrowserKeys.length === 0) {
                      // If no other browsers are released in
                      // one year range, set number aggress remove
                      // to be 0.
                      this.aggressiveRemovalDAO.put(this.RemovedAPI.create({
                        browserKey,
                        releaseDate,
                        prevBrowserKey: prevVersionKey,
                        comparedBrowserKeys: nextReleaseBrowserKeys,
                        browserName: browserInfo[0],
                        browserVersion: browserInfo[1],
                        osName: browserInfo[2],
                        aggressiveRemoval: 0,
                      }));
                    }
                    this.browserApiDAO
                    .where(this.mlang.AND(
                      this.mlang.IN(this.BrowserAPI.BROWSER_KEY,
                        nextReleaseBrowserKeys),
                      this.mlang.IN(this.BrowserAPI.INTERFACE_KEY,
                        removedInterfaceKey)))
                    .select(this.mlang.GROUP_BY(this.BrowserAPI.INTERFACE_KEY,
                      this.ArraySink.create()))
                    .then((groups) => {
                      this.aggressiveRemovalDAO.put(this.RemovedAPI.create({
                        browserKey,
                        releaseDate,
                        prevBrowserKey: prevVersionKey,
                        comparedBrowserKeys: nextReleaseBrowserKeys,
                        browserName: browserInfo[0],
                        browserVersion: browserInfo[1],
                        osName: browserInfo[2],
                        aggressiveRemoval: groups.groupKeys.length,
                      }));
                    });
                  });
                }
              }
            }
          });
      },
    },
  ],
});
