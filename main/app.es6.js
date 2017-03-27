// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

require('angular');
require('angular-ui-router');
require('../lib/web_apis/browser_api.es6');
require('../lib/client/api_matrix.es6');
require('../lib/client/confluence_metrics.es6');

let app = angular.module('confluence', ['ui.router']);

require('../lib/client/api_catalog.es6');
require('../lib/client/confluence.es6');

app.config(function($stateProvider, $urlRouterProvider) {
  let homeState = {
    name: 'home',
    url: '/',
    template: require('../static/view/home.html'),
  };

  let confluenceState = {
    name: 'confluence',
    url: '/confluence',
    controller: 'confluenceController',
    template: require('../static/view/confluence.html'),
  };

  let catalogState = {
    name: 'catalog',
    url: '/catalog',
    controller: 'catalogController',
    template: require('../static/view/catalog.html'),
  };

  let PageNotFoundState = {
    name: '404',
    url: '/404',
    template: require('../static/view/404.html'),
  };

  $stateProvider.state(homeState);
  $stateProvider.state(catalogState);
  $stateProvider.state(PageNotFoundState);
  $stateProvider.state(confluenceState);

  $urlRouterProvider.when('', '/');
  $urlRouterProvider.otherwise('/404');
});

app.service('apiMatrix', function() {
  let browserApiDAO = foam.dao.RestDAO.create({
    baseURL: window.location.origin + '/browserAPIs',
    of: org.chromium.apis.web.BrowserAPI,
  });
  let apiMatrix = org.chromium.apis.web.ApiMatrix.create({
    browserAPIs: browserApiDAO,
  });
  return apiMatrix;
});

app.service('confluenceMetrics', function() {
  let apiVelocityDAO = foam.dao.RestDAO.create({
    baseURL: window.location.origin + '/apiVelocity',
    of: org.chromium.apis.web.BrowserAPI,
  });
  let failureToShipDAO = foam.dao.RestDAO.create({
    baseURL: window.location.origin + '/failureToShip',
    of: org.chromium.apis.web.BrowserDataPoint,
  });
  let vendorSpecificDAO = foam.dao.RestDAO.create({
    baseURL: window.location.origin + '/vendorSpecific',
    of: org.chromium.apis.web.BrowserDataPoint,
  });
  let aggressiveRemovalDAO = foam.dao.RestDAO.create({
    baseURL: window.location.origin + '/aggressiveRemoval',
    of: org.chromium.apis.web.removedAPI,
  });
  let confluenceMetrics = org.chromium.apis.web.ConfluenceMetrics.create({
    apiVelocityDAO,
    failureToShipDAO,
    vendorSpecificDAO,
    aggressiveRemovalDAO,
  });

  return confluenceMetrics;
});
