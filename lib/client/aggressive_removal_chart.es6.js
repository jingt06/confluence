// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

let d3 = require('d3');

function aggressiveRemovalController($scope, $timeout) {
  let getMajorVersion = function(versionNumber) {
    return versionNumber.split('.')[0]
  }
  let createNewView = function(browserKey, prevBrowserKey,
    comparedBrowserKeys) {
      this.createNewView({
        browserKey,
        prevBrowserKey,
        comparedBrowserKeys,
      });
    }.bind(this);
  this.$onInit = function() {
    console.log(this.aggressiveRemoval);
    // AngularJS does not seem to have reliable post-render callbacks.
    // Use $timeout as a hack.
    $timeout(function() {
      let width = 720;
      let height = 360;
      let margin = {top: 20, right: 50, bottom: 30, left: 50};
      // Create a sub div inside charts div.
      let div = d3.select(`#${this.chartId}`).append('div');
      // Create an svg element inside div.
      let svg = div.append('svg')
        .attr('width', width)
        .attr('height', height);
      // Append title to SVG.
      svg.append('text')
        .attr('x', (width / 2))
        .attr('y', margin.top)
        .attr('text-anchor', 'middle')
        .style('font-size', '20px')
        .style('text-decoration', 'underline')
        .text(this.title);
      // Set actual chart width and height.
      width = svg.attr('width') - margin.left - margin.right;
      height = svg.attr('height') - margin.top - margin.bottom;
      // Create a g element inside svg,
      // which will contain all paths and areas.
      let g = svg.append('g')
        .attr('transform',
          'translate(' + margin.left + ',' + margin.top + ')');
      let rightAxisUpperBound = Math.ceil(d3.max(
        this.aggressiveRemoval, (d) => d.aggressiveRemoval) / 50) * 50;
      let rightAxisLowerBound = 0;
      // X axis is browserKey.
      let x = d3.scaleBand()
        .rangeRound([0, width])
        .padding(0.2)
        .domain(this.aggressiveRemoval
          .map((d) => getMajorVersion(d.browserVersion)));
      // Y axis is number of APIs.
      let y = d3.scaleLinear()
        .rangeRound([height, 0])
        .domain([rightAxisLowerBound, rightAxisUpperBound]);
      // Append tooltip div inside chart div. (cannot append div inside svg)
      let tooltips = d3.select(`#${this.chartId}-tooltip`);
      g.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x));
      g.append('g')
        .call(d3.axisLeft(y))
        .append('text')
          .attr('transform', 'rotate(-90)')
          .attr('fill', '#000')
          .attr('y', 6)
          .attr('dy', '0.71em')
          .attr('text-anchor', 'end')
          .text('#APIs');
      g.selectAll('.bar')
        .data(this.aggressiveRemoval)
        .enter().append('rect')
          .attr('class', 'bar')
          .attr('x', (d) => x(getMajorVersion(d.browserVersion)))
          .attr('y', (d) => y(d.aggressiveRemoval))
          .attr('width', x.bandwidth())
          .attr('height', (d) => height - y(d.aggressiveRemoval))
        .style('cursor', 'pointer')
        .on('click', function(d) {
          d3.event.stopPropagation();
          $scope.tooltip = {
            browserName: d.browserName,
            properties: [
              {
                name: 'version',
                value: d.browserVersion,
              },
              {
                name: 'aggressive removal',
                value: d.aggressiveRemoval,
                action: d.prevBrowserKey ? function() {
                  createNewView(d.browserKey, d.prevBrowserKey,
                    d.comparedBrowserKeys);
                } : undefined,
              },
            ],
          };
          tooltips
            .style('opacity', .9)
            .style('left', (d3.event.pageX) + 'px')
            .style('top', (d3.event.pageY) + 'px');
          $scope.$apply();
        });
      // Click on other part of the chart, close the tooltip.
      svg.on('click', function() {
        $scope.tooltip = null;
        tooltips.style('opacity', 0);
        $scope.$apply();
      });
    }.bind(this));
  };
}

angular.module('confluence').component('aggressiveRemovalChart', {
  template: require('../../static/component/chart.html'),
  controller: ['$scope', '$timeout', aggressiveRemovalController],
  bindings: {
    aggressiveRemoval: '<',
    title: '<',
    chartId: '<',
    createNewView: '&',
  },
});
