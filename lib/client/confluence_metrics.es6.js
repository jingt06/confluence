// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

require('../confluence/version_diff.es6');
require('../confluence/browser_data_point.es6');
require('../confluence/removed_api.es6');

foam.CLASS({
  name: 'ConfluenceMetrics',
  package: 'org.chromium.apis.web',
  documentation: `ConfluenceMetrics is a client side object that
    has methods to retrieve confluence metrics from Rest DAO such
    as API velocity, failure-to-ship, aggressive removal and
    vendor-specific-APIs.`,
  requires: [
    'foam.dao.ArraySink',
    'foam.mlang.ExpressionsSingleton',
    'org.chromium.apis.web.VersionDiff',
    'org.chromium.apis.web.BrowserDataPoint',
    'org.chromium.apis.web.RemovedAPI',
  ],
  properties: [
    {
      name: 'apiVelocityDAO',
      documentation: `A DAO that contains ApiVelocity objects.`,
      typeName: 'ApiVelocity DAO',
      required: true,
      final: true,
    },
    {
      name: 'failureToShipDAO',
      documentation: `A DAO that contains number of failur-to-ship APIs for
        each browser associated with date.`,
      typeName: 'BrowserDataPoint DAO',
      required: true,
      final: true,
    },
    {
      name: 'vendorSpecificDAO',
      documentation: `A DAO that contains number of vendor-specific APIs for
        each browser associated with date.`,
      typeName: 'BrowserDataPoint DAO',
      required: true,
      final: true,
    },
    {
      name: 'aggressiveRemovalDAO',
      documentation: `A DAO that contains number of aggressive removal APIs for
        each browser associated with date.`,
      typeName: 'BrowserDataPoint DAO',
      required: true,
      final: true,
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
  ],
  methods: [
    {
      name: 'getApiVelocity',
      documentation: `Read from apiVelocityDAO and returns API velocity
        metric for each brwoser.`,
      returns: {
        typeName: 'JSON',
        documentation: `JSON of the form:
            {browserName: {osName: [
              {browserKey, totalAPI, newAPI, removedAPI}...
            ] ...} ... } ...}`,
      },
      code: function() {
        return this.apiVelocityDAO.select(this.mlang.GROUP_BY(
          this.VersionDiff.BROWSER_NAME_OS_NAME,
          this.ArraySink.create())).then((groups) => {
            let apiVelocityResult = {};
            for (let i = 0; i < groups.groupKeys.length; i++) {
              let browserOsKey = groups.groupKeys[i];
              apiVelocityResult[browserOsKey] =
                groups.groups[browserOsKey].a.map((versionDiff) => {
                  return {
                    releaseDate: new Date(versionDiff.releaseDate),
                    browserName: versionDiff.browserName,
                    browserVersion: versionDiff.browserVersion,
                    osName: versionDiff.osName,
                    osVersion: versionDiff.osVersion,
                    totalApis: versionDiff.totalApis,
                    newApis: versionDiff.newApis,
                    removedApis: versionDiff.removedApis,
                    prevBrowserKey: versionDiff.prevBrowserKey,
                    browserKey: versionDiff.browserKey,
                  };
              });
            }
            return apiVelocityResult;
          });
      },
    },
    {
      name: 'getFailureToShip',
      documentation: `Read from failure and returns API velocity
        metric for each brwoser.`,
      returns: {
        typeName: 'JSON',
        documentation: `JSON of the form:
            {browserName: {osName: [
              {browserKey, totalAPI, newAPI, removedAPI}...
            ] ...} ... } ...}`,
      },
      code: function() {
        return this.failureToShipDAO
          .orderBy(this.BrowserDataPoint.Date)
          .select(this.mlang.GROUP_BY(
            this.BrowserDataPoint.DATE,
            this.ArraySink.create())).then((groups) => {
              let failureToShipResult = {};
              Object.keys(groups.groups).forEach((date) => {
                // Date keys in FOAM are stored as unix time in String.
                groups.groups[date].a.forEach((browser) => {
                  if (!failureToShipResult
                    .hasOwnProperty(browser.browserName)) {
                      failureToShipResult[browser.browserName] = [];
                  }
                  failureToShipResult[browser.browserName].push({
                    date: new Date(date),
                    browser: browser.browserName,
                    browserKey: browser.browserKey,
                    browserVersion: browser.browserVersion,
                    allBrowserKeys: groups.groups[date].a.map((browser) =>
                      browser.browserKey),
                    value: browser.value,
                  });
                });
              });
              return failureToShipResult;
            });
      },
    },
    {
      name: 'getVendorSpecificApis',
      documentation: `Read from vendor specific API dao and returns
        vendor specific metric for each brwoser.`,
      returns: {
        typeName: 'JSON',
        documentation: `JSON of the form:
            {browserName: {osName: [
              {browserKey, totalAPI, newAPI, removedAPI}...
            ] ...} ... } ...}`,
      },
      code: function() {
        return this.vendorSpecificDAO
          .orderBy(this.BrowserDataPoint.Date)
          .select(this.mlang.GROUP_BY(
            this.BrowserDataPoint.DATE,
            this.ArraySink.create())).then((groups) => {
              let vendorSpecificResult = {};
              Object.keys(groups.groups).forEach((date) => {
                // Date keys in FOAM are stored as unix time in String.
                groups.groups[date].a.forEach((browser) => {
                  if (!vendorSpecificResult
                    .hasOwnProperty(browser.browserName)) {
                      vendorSpecificResult[browser.browserName] = [];
                  }
                  vendorSpecificResult[browser.browserName].push({
                    date: new Date(date),
                    browser: browser.browserName,
                    browserKey: browser.browserKey,
                    browserVersion: browser.browserVersion,
                    allBrowserKeys: groups.groups[date].a.map((browser) =>
                      browser.browserKey),
                    value: browser.value,
                  });
                });
              });
              return vendorSpecificResult;
            });
      },
    },
    {
      name: 'getAggressiveRemoval',
      documentation: `Read from failure and returns API velocity
        metric for each brwoser.`,
      returns: {
        typeName: 'JSON',
        documentation: `JSON of the form:
            {browserName: {osName: [
              {browserKey, totalAPI, newAPI, removedAPI}...
            ] ...} ... } ...}`,
      },
      code: function() {
        return this.aggressiveRemovalDAO
          .orderBy(this.RemovedAPI.BROWSER_KEY)
          .select(this.mlang.GROUP_BY(
            this.RemovedAPI.BROWSER_NAME_OS_NAME,
            this.ArraySink.create()))
          .then((groups) => {
            let aggressiveRemovalResult = {};
            for (let i = 0; i < groups.groupKeys.length; i++) {
              let browserOsKey = groups.groupKeys[i];
              aggressiveRemovalResult[browserOsKey] =
                groups.groups[browserOsKey].a.map((aggressiveRemoval) => {
                  return {
                    releaseDate: new Date(aggressiveRemoval.releaseDate),
                    browserName: aggressiveRemoval.browserName,
                    browserVersion: aggressiveRemoval.browserVersion,
                    osName: aggressiveRemoval.osName,
                    aggressiveRemoval: aggressiveRemoval.aggressiveRemoval,
                    prevBrowserKey: aggressiveRemoval.prevBrowserKey,
                    browserKey: aggressiveRemoval.browserKey,
                    comparedBrowserKeys: aggressiveRemoval.comparedBrowserKeys,
                  };
              });
            }
            return aggressiveRemovalResult;
          });
      },
    },
  ],
});
