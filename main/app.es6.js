require('angular');
require('angular-ui-router');

let app = angular.module('confluence', ['ui.router']);

app.config(function($stateProvider, $urlRouterProvider) {
  let homeState = {
    name: 'home',
    url: '/',
    template: require('../static/view/home.html'),
  };

  let confluenceState = {
    name: 'confluence',
    url: '/confluence',
    template: require('../static/view/confluence.html'),
  };

  let catalogState = {
    name: 'catalog',
    url: '/catalog',
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
