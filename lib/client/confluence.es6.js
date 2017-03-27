// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

require('./api_velocity_chart.es6');
require('./num_api_chart.es6');
require('./aggressive_removal_chart.es6');

angular.module('confluence')
  .controller('confluenceController',
    ['$scope', 'confluenceMetrics', 'apiMatrix', function(
      $scope, confluenceMetrics, apiMatrix) {
    // Activate tabs.
    angular.element('ul.tabs').tabs();
    $scope.showTab = 0;
    $scope.apiVelocityMetrics = {};
    $scope.failureToShipMetric = null;
    $scope.vendorSpecificMetric = null;
    $scope.additionalViews = [];
    $scope.apiMatrix = apiMatrix;

    confluenceMetrics.getApiVelocity().then((apiVelocityMetrics) => {
      $scope.apiVelocityMetrics = apiVelocityMetrics;
      $scope.$apply();
    });

    confluenceMetrics.getFailureToShip().then((failureToShipMetric) => {
      $scope.failureToShipMetric = failureToShipMetric;
      $scope.singleFaulureMetrics = Object.keys(failureToShipMetric)
        .map((browserName) => {
          let result = {};
          result[browserName] = failureToShipMetric[browserName];
          return {
            metric: result,
            browserName,
          };
        });
      $scope.$apply();
    });

    confluenceMetrics.getVendorSpecificApis().then((vendorSpecificMetric) => {
      $scope.vendorSpecificMetric = vendorSpecificMetric;
      $scope.singleVendorSpecificMetrics = Object.keys(vendorSpecificMetric)
        .map((browserName) => {
          let result = {};
          result[browserName] = vendorSpecificMetric[browserName];
          return {
            metric: result,
            browserName,
          };
        });
      $scope.$apply();
    });

    confluenceMetrics.getAggressiveRemoval()
      .then((aggressiveRemovalMetrics) => {
        $scope.aggressiveRemovalMetrics = aggressiveRemovalMetrics;
      });

    $scope.createNewDiffView = function(minuend, subtrahend) {
      let browserOptions = {};
      browserOptions[minuend] = true;
      browserOptions[subtrahend] = false;
      $scope.additionalViews.push({
        browserKeys: [minuend, subtrahend],
        browserOptions,
      });
    };
    $scope.newFailureToShipView = function(browserKey, allBrowserKeys) {
      let browserOptions = {};
      browserOptions[browserKey] = false;
      $scope.additionalViews.push({
        browserKeys: allBrowserKeys,
        browserOptions,
        lengths: [allBrowserKeys.length - 1,
          allBrowserKeys.length - 2],
      });
    };
    $scope.newVendorSpecificView = function(browserKey, allBrowserKeys) {
      let browserOptions = {};
      for (let i = 0; i < allBrowserKeys.length; i++) {
       browserOptions[allBrowserKeys[i]] = false;
      }
      browserOptions[browserKey] = true;
      $scope.additionalViews.push({
        browserKeys: allBrowserKeys,
        browserOptions,
      });
    };
    $scope.newRemovedView = function(browserKey, prevBrowserKey,
      comparedBrowserKeys) {
        let browserKeys = comparedBrowserKeys.slice();
        browserKeys.push(browserKey, prevBrowserKey);
        let browserOptions = {};
        // Set browser options to be true for all compared
        // browser keys and previous browser key, false for
        // current brwoserkey. This will filter out
        // the remvoed APIs from current version which
        // still exists in other browsers.
        browserOptions[prevBrowserKey] = true;
        browserOptions[browserKey] = false;
        let lengths = [];
        for (let i = 2; i < browserKeys.length; i++) {
          lengths.push(i);
        }
        $scope.additionalViews.push({
          browserKeys,
          browserOptions,
          lengths,
        });
    };
  }]);
