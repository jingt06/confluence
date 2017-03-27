// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

require('./api_catalog_table.es6');
require('./api_analytics.es6');

angular.module('confluence')
  .controller('catalogController',
    ['$scope', 'apiMatrix', function($scope, apiMatrix) {
    // Activate dropdown and tabs.
    angular.element('.add-browser-dropdown').dropdown();
    angular.element('ul.tabs').tabs();
    // TODO: Get latest browserKeys from browserAPI DAO.
    $scope.browserKeys = [
      'Chrome_56.0.2924.87_Windows_10.0',
      'Edge_14.14393_Windows_10.0',
      'Firefox_52.0_Windows_10.0',
      'Safari_602.4.8_OSX_10.12.3',
    ];
    $scope.resultMatrix = {};
    $scope.apiMatrix = apiMatrix;
    $scope.showTab = 0;
    $scope.filteredViews = [];

    function alertError(errorMsg) {
      Materialize.toast(errorMsg, 4000)
    }
    apiMatrix.getBrowserKeys().then((browserKeys) => {
      $scope.allBrowsersKeys = {};
      $scope.expandBrowserDropdown = {};
      browserKeys.forEach((browserKey) => {
        let browserInfo = browserKey.split('_');
        let browserName = browserInfo[0];
        let browserVersion = browserInfo[1];
        let os = `${browserInfo[2]}_${browserInfo[3]}`
        if (!$scope.allBrowsersKeys.hasOwnProperty(browserName)) {
          $scope.allBrowsersKeys[browserName] = {};
        }
        if (!$scope.allBrowsersKeys[browserName]
          .hasOwnProperty(browserVersion)) {
            $scope.allBrowsersKeys[browserName][browserVersion] = [];
          }
        $scope.allBrowsersKeys[browserName][browserVersion].push(os);
      });
      $scope.$apply();
    });

    $scope.expandBrowserList = function($event, browser, version) {
      // Stop propagation to stop dropdown list disapearing.
      $event.stopPropagation();
      if (version) {
        if ($scope.expandBrowserDropdown[browser].hasOwnProperty(version)) {
          delete $scope.expandBrowserDropdown[browser][version];
        } else {
          $scope.expandBrowserDropdown[browser][version] = true;
        }
        return;
      }
      if (browser) {
        if ($scope.expandBrowserDropdown.hasOwnProperty(browser)) {
          delete $scope.expandBrowserDropdown[browser];
        } else {
          $scope.expandBrowserDropdown[browser] = {};
        }
      }
    };

    $scope.addBrowser = function(browser, version, osType) {
      let browserKey = `${browser}_${version}_${osType}`;
      if ($scope.browserKeys.indexOf(browserKey) >= 0) {
        alertError('This browser is already selected.');
        return;
      }
      // Array.push does not trigger component's $onChanges listener.
      // Need to create a new Array.
      $scope.browserKeys = $scope.browserKeys.concat([browserKey]);
    };

    $scope.removeBrowser = function(browserKey) {
      let removeIndex = $scope.browserKeys.indexOf(browserKey);
      if (removeIndex === -1) return;
      $scope.browserKeys.splice(removeIndex, 1);
      // Same as above, create a new array to trigger $onChanges listerner.
      $scope.browserKeys = $scope.browserKeys.slice();
    };

    $scope.createView = function(browserKey, option) {
      let browserOptions = {};
      switch(option) {
        case 'fallBehind':
          for (let i = 0; i < $scope.browserKeys.length; i++) {
            browserOptions[$scope.browserKeys[i]] = true;
          }
          browserOptions[browserKey] = false;
          break;
        case 'proprietary':
          for (let i = 0; i < $scope.browserKeys.length; i++) {
            browserOptions[$scope.browserKeys[i]] = false;
          }
          browserOptions[browserKey] = true;
          break;
      }
      $scope.filteredViews.push({
        browserKeys: $scope.browserKeys.slice(),
        browserOptions,
      });
    };
  }]);
