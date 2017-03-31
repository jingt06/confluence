/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

describe('ApiMatrix', function() {
  let apiMatrix;
  let browser = function(browserName, browserVersion,
    osName, osVersion) {
      return org.chromium.apis.web.Browser.create({
        browserName,
        browserVersion,
        osName,
        osVersion,
      });
    };
  let webInterface = function(interfaceName, apiName) {
    return org.chromium.apis.web.WebInterface.create({
      interfaceName,
      apiName,
    });
  };
  let browserAPI = function(browserName, browserVersion,
    osName, osVersion, interfaceName, apiName) {
      return org.chromium.apis.web.BrowserWebInterfaceJunction.create({
        sourceId: `${browserName}_${browserVersion}_${osName}_${osVersion}`,
        targetId: `${interfaceName}#${apiName}`,
      });
    };
  beforeEach(function() {
    let browserDAO = foam.dao.EasyDAO.create({
      name: 'browserDAO',
      of: org.chromium.apis.web.Browser,
      daoType: 'MDAO',
    });
    let interfaceDAO = foam.dao.EasyDAO.create({
      name: 'interfaceDAO',
      of: org.chromium.apis.web.WebInterface,
      daoType: 'MDAO',
    });
    let browserApiDAO = foam.dao.EasyDAO.create({
      name: 'browserApiDao',
      of: org.chromium.apis.web.BrowserWebInterfaceJunction,
      daoType: 'MDAO',
    });
    browserApiDAO.put(browserAPI('Chrome', '55', 'Windows', '10',
      'Array', 'find'));
    browserApiDAO.put(browserAPI('Chrome', '55', 'Windows', '10',
      'Audio', 'stop'));
    browserApiDAO.put(browserAPI('Edge', '14', 'Windows', '10',
      'Array', 'find'));
    browserApiDAO.put(browserAPI('Edge', '14', 'Windows', '10',
      'Audio', 'play'));
    browserApiDAO.put(browserAPI('Safari', '10', 'OSX', '601',
      'ApplePay', 'about'));
    browserApiDAO.put(browserAPI('Safari', '10', 'OSX', '601',
      'Audio', 'play'));
    browserApiDAO.put(browserAPI('Safari', '10', 'OSX', '601',
      'Audio', 'stop'));
    browserApiDAO.put(browserAPI('Safari', '10', 'OSX', '601',
      'Array', 'find'));
    browserDAO.put(browser('Chrome', '55', 'Windows', '10'));
    browserDAO.put(browser('Edge', '14', 'Windows', '10'));
    browserDAO.put(browser('Safari', '10', 'OSX', '601'));
    interfaceDAO.put(webInterface('Array', 'find'));
    interfaceDAO.put(webInterface('Audio', 'play'));
    interfaceDAO.put(webInterface('Audio', 'stop'));
    interfaceDAO.put(webInterface('ApplePay', 'about'));
    apiMatrix = org.chromium.apis.web.ApiMatrix.create({
      browserApiDAO,
      browserDAO,
      interfaceDAO,
    },
    // Mock exports expected from ApiExtractor.
    foam.__context__.createSubContext({
      browserDAO,
      webInterfaceDAO: interfaceDAO,
      browserWebInterfaceJunctionDAO: browserApiDAO,
    }));
  });

  describe('toMatrix()', function() {
    it(`contains correct interface and API information, when all browsers
      are selected`, function(done) {
        apiMatrix.toMatrix([
          'Chrome_55_Windows_10',
          'Edge_14_Windows_10',
          'Safari_10_OSX_601',
        ]).then((interfaceMatrix) => {
          expect(interfaceMatrix.ApplePay.about).toEqual({
            Safari_10_OSX_601: true,
          });
          expect(interfaceMatrix.ApplePay.about.Chrome_55_Windows_10)
            .toBeUndefined();
          expect(interfaceMatrix.ApplePay.about.Edge_14_Windows_10)
            .toBeUndefined();
          expect(interfaceMatrix.Array.find).toEqual({
            Chrome_55_Windows_10: true,
            Edge_14_Windows_10: true,
            Safari_10_OSX_601: true,
          });
          expect(interfaceMatrix.Audio.play).toEqual({
            Edge_14_Windows_10: true,
            Safari_10_OSX_601: true,
          });
          expect(interfaceMatrix.Audio.stop).toEqual({
            Chrome_55_Windows_10: true,
            Safari_10_OSX_601: true,
          });
        });
        done();
      });
    it(`contains correct interface and API information, when part of
      keys are selected.`, function(done) {
        apiMatrix.toMatrix([
          'Chrome_55_Windows_10',
          'Edge_14_Windows_10',
        ]).then((interfaceMatrix) => {
          expect(interfaceMatrix.Array.find).toEqual({
            Chrome_55_Windows_10: true,
            Edge_14_Windows_10: true,
          });
          expect(interfaceMatrix.Audio.play).toEqual({
            Edge_14_Windows_10: true,
          });
          expect(interfaceMatrix.Audio.stop).toEqual({
            Chrome_55_Windows_10: true,
          });
          done();
        });
      });
    it('returns empty object when given array of browser keys is empty.',
      function(done) {
        apiMatrix.toMatrix([]).then((interfaceMatrix) => {
          expect(interfaceMatrix).toEqual({});
          done();
        });
    });
    // TODO(jingt06): We should expect to throw on unknown browser keys.
    // The behaviour described below creates the illusion that there exists
    // data for unknown browsers.
    xit('produces correct result when unknown browser key is given.',
      function(done) {
        apiMatrix.toMatrix([
          'Chrome_55_Windows_10',
          'IE_10_Windows_8',
        ]).then((interfaceMatrix) => {
          expect(interfaceMatrix).toEqual({
            Array: {
              find: {
                Chrome_55_Windows_10: true,
              },
            },
            Audio: {
              stop: {
                Chrome_55_Windows_10: true,
              },
            },
          });
          done();
        });
    });
  });

  describe('toCSV()', function() {
    it(`produces correct csv string when all browsers are selected`,
    function(done) {
      apiMatrix.toCSV([
        'Chrome_55_Windows_10',
        'Edge_14_Windows_10',
        'Safari_10_OSX_601',
      ]).then((csvStr) => {
        expect(csvStr).toEqual(
          'Interface,API,Chrome_55_Windows_10,Edge_14_Windows_10,' +
          'Safari_10_OSX_601\n' + 'ApplePay,about,false,false,true\n' +
          'Array,find,true,true,true\n' + 'Audio,play,false,true,true\n' +
          'Audio,stop,true,false,true\n');
        done();
      });
    });
    it(`produces correct csv string when part of browsers are selected`,
    function(done) {
      apiMatrix.toCSV([
        'Chrome_55_Windows_10',
        'Edge_14_Windows_10',
      ]).then((csvStr) => {
        expect(csvStr).toEqual(
          'Interface,API,Chrome_55_Windows_10,Edge_14_Windows_10\n' +
          'Array,find,true,true\n' + 'Audio,play,false,true\n' +
          'Audio,stop,true,false\n');
        done();
      });
    });
    it('returns empty csv when given array of browser keys is empty.',
      function(done) {
        apiMatrix.toCSV([]).then((csvStr) => {
          expect(csvStr).toEqual('Interface,API\n');
          done();
        });
    });
    // TODO(jingt06): We should expect to throw on unknown browser keys.
    // The behaviour described below creates the illusion that there exists
    // data for unknown browsers.
    xit('lists  all false for a unknown browser key.',
      function(done) {
        apiMatrix.toCSV([
          'Chrome_55_Windows_10',
          'IE_10_Windows_8',
        ]).then((csvStr) => {
          expect(csvStr).toEqual(
            'Interface,API,Chrome_55_Windows_10,IE_10_Windows_8\n' +
            'Array,find,true,false\n' + 'Audio,stop,true,false\n');
          done();
        });
    });
    it('has a table header with the same order of given browser keys',
      function(done) {
        apiMatrix.toCSV([
          'Edge_14_Windows_10',
          'Safari_10_OSX_601',
          'Chrome_55_Windows_10',
        ]).then((csvStr) => {
          expect(csvStr.split('\n')[0]).toEqual(
            'Interface,API,Edge_14_Windows_10,' +
            'Safari_10_OSX_601,Chrome_55_Windows_10'
          );
          done();
        });
      });
  });
});
