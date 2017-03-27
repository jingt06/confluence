// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

let d3 = require('d3');

function chartController($scope, $timeout) {
  let createNewView = function(browserKey, allBrowserKeys) {
    this.createNewView({browserKey, allBrowserKeys});
  }.bind(this);
  this.$onInit = function() {
    // AngularJS does not seem to have reliable post-render callbacks.
    // Use $timeout as a hack.
    $timeout(function() {
      let browserData = Object.keys(this.numApiData)
        .map((browserName) => {
          return {
            browserName,
            values: this.numApiData[browserName],
          };
        });
      let width = 720;
      let height = 360;
      let margin = {top: 20, right: 50, bottom: 30, left: 50};
      // Create a sub div inside charts div.
      let div = d3.select(`#${this.chartId}`).append('div');
      // Create tootip div inside div.
      let tooltips = d3.select(`#${this.chartId}-tooltip`);
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
        browserData, (apiNumArrary) => {
          return d3.max(apiNumArrary.values, (d) => d.value);
        }) / 20) * 20;
      let rightAxisLowerBound = Math.floor(d3.min(
        browserData, (apiNumArrary) => {
          return d3.min(apiNumArrary.values, (d) => d.value);
        }) / 20) * 20;
      // Since the date for each browser array is the same.
      let dates = this.numApiData[Object.keys(this.numApiData)[0]]
        .map((d) => d.date);
      // X axis is release date.
      let x = d3.scaleTime()
        .rangeRound([0, width])
        .domain(d3.extent(dates));
      // Y axis is number of APIs.
      let y = d3.scaleLinear()
        .rangeRound([height, 0])
        .domain([rightAxisLowerBound, rightAxisUpperBound]);
      // Z domain is browsers.
      // Use color schemes to work with d3.scaleOrdinal.
      let z = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(Object.keys(this.numApiData));
      // Draw aixises.
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

      let line = d3.line()
          .x((d) => x(d.date))
          .y((d) => y(d.value));
      svg.selectAll('dot')
        .data(browserData.reduce((acc, curr) => {
          return acc.concat(curr.values);
        }, []))
        .enter().append('circle')
          .attr('r', 5)
          .attr('cx', (d) => x(d.date) + margin.left)
          .attr('cy', (d) => y(d.value) + margin.top)
          .style('cursor', 'pointer')
            .on('click', function(d) {
              d3.event.stopPropagation();
              $scope.tooltip = {
                browserName: d.browser,
                properties: [
                  {
                    name: 'key',
                    value: d.browserKey,
                  },
                  {
                    name: 'value',
                    value: d.value,
                    action: function() {
                      createNewView(d.browserKey, d.allBrowserKeys);
                    },
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
      let browser = g.selectAll('.browser')
        .data(browserData)
        .enter().append('g')
          .attr('class', 'browser');
      // Draw lines for each brwoser.
      browser.append('path')
          .attr('class', 'line')
          .attr('d', (d) => line(d.values))
          .style('stroke', (d) => z(d.browserName));
      // Add label for each line.
      browser.append('text')
          .datum((d) => {
            return {
              id: d.browserName,
              value: d.values[d.values.length - 1],
            };
          })
          .attr('transform', (d) =>
            `translate(${x(d.value.date)},${y(d.value.value)})`)
          .attr('x', 3)
          .attr('dy', '0.35em')
          .style('font', '10px')
          .text((d) => d.id);
        }.bind(this));
  };
}

angular.module('confluence').component('numApiChart', {
  template: require('../../static/component/chart.html'),
  controller: ['$scope', '$timeout', chartController],
  bindings: {
    numApiData: '<',
    title: '<',
    chartId: '<',
    createNewView: '&',
  },
});
