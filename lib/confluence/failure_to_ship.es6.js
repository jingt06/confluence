// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

foam.CLASS({
  name: 'FailureToShip',
  package: 'org.chromium.apis.web',
  documentation: `FailureToShip is a class that computes the failure-
    -to-ship metric from browserAPIs DAO. Failure-to-ship APIs are
    APIs that is available in at least three other browsers but not in
    this browser.`,
  requires: [
    'org.chromium.apis.web.BrowserAPI',
    'org.chromium.apis.web.failureToShip',
    'org.chromium.apis.web.BrowserHistory',
    'org.chromium.apis.web.BrowserDataPoint',
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
      name: 'failureToShipDAO',
      documentation: `This should be a DAO that contains BrowserDataPoints.`,
      final: true,
      factory: function() {
        return this.EasyDAO.create({
          name: 'failureToShipDAO',
          of: this.BrowserDataPoint,
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
      documentation: `The init function computes the Failure-to-ship
        metric for each major browsers contained in the given browserApiDAO.
        The data point is computed at the time when there is a new release
        for any browser.`,
      code: function() {
        this.browserApiDAO.orderBy(this.BrowserAPI.INTERFACE_KEY)
        .select(this.mlang.GROUP_BY(
          this.BrowserAPI.BROWSER_KEY,
          this.ArraySink.create()))
          .then((groups) => {
            // Sort the groupKeys in alphabet order,
            // so the older version appears in front.
            let browserKeys = groups.groupKeys.sort();
            let browserList = {};
            // FOAM does not suport nested GROUP_BY, so need manually
            // Group browsers by browserName.
            for (let i = 0; i < browserKeys.length; i++) {
              let browserKey = browserKeys[i];
              let browserName = browserKey.split('_')[0];
              if (!browserList.hasOwnProperty(browserName)) {
                browserList[browserName] = [];
              }
              browserList[browserName].push({
                browserKey,
                releaseDate: this.browserHistory
                  .getReleaseDate(browserKey),
              });
            }
            // nextReleaseDate will be the time point that used to
            // caculated the failure-to-ship result. The first
            // nextReleaseDate will be on the day that
            // all browsers have at least one release version.
            let nextReleaseDate = null;
            Object.keys(browserList).forEach((browser) => {
              if (nextReleaseDate === null ||
                nextReleaseDate < browserList[browser][0].releaseDate) {
                  nextReleaseDate = browserList[browser][0].releaseDate;
              }
            });
            while(nextReleaseDate !== null) {
              // Remove version that is before nextReleaseDate.
              Object.keys(browserList).forEach((browser) => {
                while(browserList[browser][0].releaseDate <= nextReleaseDate) {
                  if (browserList[browser].length <= 1 ||
                    browserList[browser][1].releaseDate > nextReleaseDate) {
                      // Compute failure to ship value for this version browser
                      // at nextReleaseDate time point.
                      browserList[browser][0].releaseDate = nextReleaseDate;
                      break;
                  }
                  browserList[browser].shift();
                }
              });
              this.computeFailureToShip(Object.keys(browserList)
                .map((browser) => {
                  return browserList[browser][0].browserKey;
              }), nextReleaseDate);
              // Update nextReleaseDate to the next most recent release.
              nextReleaseDate = null;
              Object.keys(browserList).reduce((browser, currBrowserName) => {
                if (browserList[currBrowserName].length > 1 &&
                  (nextReleaseDate === null ||
                  browserList[currBrowserName][1].releaseDate
                  < nextReleaseDate)) {
                    nextReleaseDate =browserList[
                      currBrowserName][1].releaseDate;
                    return browserList[currBrowserName];
                }
                return browser;
              }, browserList[Object.keys(browserList)[0]]).shift();
              // While loop will break if cannot find next release date.
            }
          });
      },
    },
    {
      name: 'computeFailureToShip',
      documentation: `Computer the failure-to-ship value for each browsers
        in browserKeys.`,
      args: [
        {
          name: 'browserKeys',
          typeName: 'StringArray',
          documentation: `An array of valid browser keys are used to calculate
            the failure-to-ship value.`,
        },
        {
          name: 'date',
          typeName: 'Date',
          documentation: `The time date time which the failure-to-ship value
            associated to.`,
        },
      ],
      code: function(browserKeys, date) {
        this.browserApiDAO
          .where(this.mlang.IN(this.BrowserAPI.BROWSER_KEY, browserKeys))
          .orderBy(this.BrowserAPI.INTERFACE_KEY)
          .select(this.mlang.GROUP_BY(this.BrowserAPI.INTERFACE_KEY,
            this.ArraySink.create()))
          .then((groups) => {
            // successShipMap is the number of APIs in each browser
            // that is shipped in at least two other browsers.
            let successShipMap = {};
            browserKeys.forEach((browserKey) => {
              successShipMap[browserKey] = 0;
            });
            let numApiWithMoreThanThreeBrowsers = 0;
            let interfaceKeys = groups.groupKeys;
            for (let i = 0; i < interfaceKeys.length; i++) {
              let browsers = groups.groups[interfaceKeys[i]].a;
              if (browsers.length >= 3) {
                numApiWithMoreThanThreeBrowsers++;
                for (let j = 0; j < browsers.length; j++) {
                  successShipMap[browsers[j].browserKey]++;
                }
              }
            }
            browserKeys.forEach((browserKey) => {
              let browserName = browserKey.split('_')[0];
              this.failureToShipDAO.put(this.BrowserDataPoint.create({
                browserName,
                browserKey,
                date,
                value: numApiWithMoreThanThreeBrowsers
                  - successShipMap[browserKey],
              }));
            });
          });
      },
    },
  ],
});
