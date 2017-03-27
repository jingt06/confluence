// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

foam.CLASS({
  name: 'ApiMatrix',
  package: 'org.chromium.apis.web',
  documentation: `ApiMatrix is a client side object that has methods
    to retrieve browserAPIs from server DAO, transform browserAPIs to
    CSV format string, tranform browserAPIs to object that can be
    displayed on HTML as a nested table.`,
  requires: [
    'foam.dao.EasyDAO',
    'foam.dao.ArraySink',
    'foam.mlang.sink.Count',
    'foam.mlang.ExpressionsSingleton',
    'org.chromium.apis.web.BrowserAPI',
  ],
  properties: [
    {
      name: 'browserAPIs',
      documentation: `The WebAPIs object where the browserAPIs will be
        be fetched from.`,
      typeName: 'BrowserAPI DAO',
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
      name: 'getBrowserKeys',
      documentation: `An asynchronous method that returns an array of
        browserKeys that is stored in its browserAPI DAO.`,
      returns: {
        typeName: 'StringArray',
        documentation: `An array of available browserKeys in browserAPIs`,
      },
      code: function() {
        return this.browserAPIs
          .select(this.mlang.GROUP_BY(this.BrowserAPI.BROWSER_KEY,
            this.Count.create()))
          .then((groups) => {
            return groups.groupKeys;
          });
      },
    },
    {
      name: 'toMatrix',
      documentation: `An asynchronous method that takes an array of browser
        keys, produces a nested matrix that contains browser and interface
        relationship. This structure should be easy to be displayed as a
        nested table in client side.`,
      args: [
        {
          name: 'browserKeys',
          typeName: 'StringArray',
          documentation: `Valid browser keys used to filter browserAPIs.`,
        },
        {
          name: 'options',
          typeName: 'JSON',
          documentation: `An optional argument are used to filter the
            matrix result:
              searchKey: the result interface/API must contains this String
                value, ignore cases.
              browserOptions: An JSON of form {browserKey: boolean, ...}
                the returned result are filtered based on the options.
              length: an Integer that the apis whose number of available
                browsers does not match this number will be filtered.
              lengths: an Interger Array contains intergers that the apis
                whose number of available browsers does not caontained
                in this array will be filtered`,
        },
      ],
      returns: {
        typeName: 'JSON',
        documentation: `JSON of the form:
            {interfaceName: {apiName: {BrowserKey: true, ...} ...} ... } ...}
            This structure is easy for displaying a nested table.`,
      },
      code: function(browserKeys, options) {
        options = options || {};
        let query = this.mlang.IN(this.BrowserAPI.BROWSER_KEY, browserKeys);
        if (options.searchKey) {
          query = this.mlang.AND(query, this.mlang
            .CONTAINS_IC(this.BrowserAPI.INTERFACE_KEY, options.searchKey));
        }
        return this.browserAPIs
          .where(query)
          .orderBy(this.BrowserAPI.INTERFACE_KEY)
          .select(this.mlang.GROUP_BY(this.BrowserAPI.INTERFACE_KEY,
            this.ArraySink.create()))
          .then((groups) => {
            return this.groupToMatrix(groups, options);
          });
      },
    },
    {
      name: 'groupToMatrix',
      documentation: `An method that takes result from GROUP_BY and produces
        a nested matrix that contains browser and interface relationship.`,
      args: [
        {
          name: 'groups',
          typeName: 'StringArray',
          documentation: `The result returns from DAO.select(GROUP_BY).`,
        },
      ],
      returns: {
        typeName: 'JSON',
        documentation: `JSON of the form:
            {interfaceName: {apiName: {BrowserKey: true, ...} ...} ... } ...}
            This structure is easy for displaying a nested table.`,
      },
      code: function(groups, options) {
        options = options || {};
        let browserOptions = options.browserOptions;
        let length = options.length;
        let lengths = options.lengths;
        let matrix = {};
        let interfaceApis = groups.groupKeys;
        for (let i = 0; i < interfaceApis.length; i++) {
          let browserAPIs = groups.groups[interfaceApis[i]].a;
          if (browserOptions) {
            let optionCount = 0;
            if(browserAPIs.filter((browserAPI) => {
              // If this browser is not specified in browser options.
              if (!browserOptions.hasOwnProperty(browserAPI.browserKey)) {
                return false;
              }
              // This browser have this and but browser options
              // want API that this browser does have.
              if (browserOptions[browserAPI.browserKey]) {
                optionCount++;
                return false;
              }
              // This browser have this API but browser options
              // want API that this browser does not have.
              return true;
            }).length !== 0) {
              continue;
            }
            // Do not include this api if not all browserOptions
            // that have a true value are satisfied.
            if (optionCount !== Object.keys(browserOptions).filter((key) => {
              return browserOptions[key];
            }).length) {
              continue;
            }
          }
          if (length && browserAPIs.length !== length) {
            continue;
          }
          if (lengths && lengths.indexOf(browserAPIs.length) === -1) {
            continue;
          }
          let interfaceName = browserAPIs[0].interfaceName;
          let apiName = browserAPIs[0].apiName;
          if (!matrix.hasOwnProperty(interfaceName)) {
            matrix[interfaceName] = {};
          }
          matrix[interfaceName][apiName] = {};
          for (let j = 0; j < browserAPIs.length; j++) {
            matrix[interfaceName][apiName][
              browserAPIs[j].browserKey] = true;
          }
        }
        return matrix;
      },
    },
    {
      name: 'toCSV',
      documentation: `Takes an array of browser keys, produces a string of
        CSV format.`,
      args: [
        {
          name: 'browserKeys',
          typeName: 'StringArray',
          documentation: `A string array contains valid browser keys.`,
        },
      ],
      returns: {
        typeName: 'String',
        documentation: `A string of csv format.`,
      },
      code: function(browserKeys, options) {
        return this.toMatrix(browserKeys, options).then(function(result) {
          return this.matrixToCSV(browserKeys, result);
        }.bind(this));
      },
    },
    {
      name: 'matrixToCSV',
      documentation: `Takes an array of browser keys, and a JSON of the
        API Matrix form, produces a string of CSV format.`,
      args: [
        {
          name: 'browserKeys',
          typeName: 'StringArray',
          documentation: `A string array contains valid browser keys.`,
        },
        {
          name: 'matrix',
          typeName: 'JSON',
          documentation: `A JSON of the API Matrix form.`,
        },
      ],
      returns: {
        typeName: 'String',
        documentation: `A string of csv format.`,
      },
      code: function(browserKeys, matrix) {
        let table = [];
        // Add table header.
        table.push(['Interface', 'API'].concat(browserKeys));
        let interfaces = Object.keys(matrix);
        for (let i = 0; i < interfaces.length; i++) {
          let interfaceName = interfaces[i];
          let APIs = Object.keys(matrix[interfaceName]);
          for (let j = 0; j < APIs.length; j++) {
            let apiName = APIs[j];
            let row = [interfaceName, apiName];
            for (let k = 0; k < browserKeys.length; k++) {
              row.push(matrix[interfaceName][apiName]
                .hasOwnProperty(browserKeys[k]));
            }
            table.push(row);
          }
        }
        let csv = '';
        for (let i = 0; i < table.length; i++) {
          csv += table[i].join(',');
          csv += '\n';
        }
        return csv;
      },
    },
    {
      name: 'getAnalytics',
      documentation: `Takes an array of browser keys, produces a JSON
        contains number of proprietary APIs and falling behind APIs for
        each selected browsers.`,
      args: [
        {
          name: 'browserKeys',
          typeName: 'StringArray',
          documentation: `A string array contains valid browser keys.`,
        },
      ],
      returns: {
        typeName: 'JSON',
        documentation: `A JSON of form
          {browserKey: {total: number, proprietary: number, fallBehind: number}}.`,
      },
      code: function(browserKeys) {
        return this.browserAPIs
          .where(this.mlang.IN(this.BrowserAPI.BROWSER_KEY, browserKeys))
          .orderBy(this.BrowserAPI.INTERFACE_KEY)
          .select(this.mlang.GROUP_BY(this.BrowserAPI.INTERFACE_KEY,
            this.ArraySink.create()))
          .then((groups) => {
            let result = {};
            let totalBrowsers = browserKeys.length;
            let interfaceKeys = groups.groupKeys;
            for (let i = 0; i < browserKeys.length; i++) {
              result[browserKeys[i]] = {
                // Total is the total number of APIs belongs to
                // this browser.
                total: 0,
                // Proprietary is the number of APIs that
                // only exists in this browser,
                proprietary: 0,
                // FallBehind is the number of APIs that exists
                // in all other selected browsers but this browser.
                fallBehind: 0,
              };
            }
            for (let i = 0; i < interfaceKeys.length; i++) {
              let interfaceKey = interfaceKeys[i];
              let availableBrowsers = {};
              let browsers = groups.groups[interfaceKey].a;
              for (let j = 0; j < browsers.length; j++) {
                result[browsers[j].browserKey].total++;
                availableBrowsers[browsers[j].browserKey] = true;
                if (browsers.length === 1) {
                  result[browsers[j].browserKey].proprietary++;
                }
              }
              if (browsers.length === totalBrowsers - 1) {
                browserKeys.map((browserKey) => {
                  if(!availableBrowsers.hasOwnProperty(browserKey)) {
                    result[browserKey].fallBehind++;
                  }
                });
              }
            }
            return result;
          });
      },
    },
  ],
});
