// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

foam.CLASS({
  name: 'BrowserDataPoint',
  package: 'org.chromium.apis.web',
  documentation: `This class contains a browserName, browserKey,
    data and value. It can be used to store values for failure-
    -to-ship metric and vendor-specific metric.`,
  ids: ['browserKey', 'date'],
  properties: [
    {
      name: 'browserName',
      class: 'String',
      documentation: 'Name of the Browser',
      required: true,
      final: true,
    },
    {
      name: 'browserKey',
      class: 'String',
      documentation: 'BrowserKey of this browser and version.',
      required: true,
      final: true,
    },
    {
      name: 'date',
      class: 'Date',
      documentation: 'The date at which it is computed.',
      required: true,
      final: true,
    },
    {
      name: 'value',
      class: 'Int',
      documentation: 'The number of APIs.',
      required: true,
      final: true,
    },
  ],
});
