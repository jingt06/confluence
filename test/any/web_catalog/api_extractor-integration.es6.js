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

/**
 *  The integration test is to test if the api-extractior are able to
 *  extract interface and api correctly from a small but complete object graph.
 *  This object graph is manually created to test corner cases, including:
 *      - Objects and Functions with prototype that have meaningful properties.
 *      - Object libraries.
 *      - Constant properties.
 *      - Different properties reference to the same object.
 *      - Hidden interfaces in __proto__ chain.
 *      - Hiden properties in instances.
 *      - __proto__ of some object is a property of another object.
 */

// Integration tests.
describe('API extractor', function() {
  let objectGraph = global.ObjectGraph;
  let og = objectGraph.fromJSON(
  {
    'data': {
      '10000': {  // window
        'Function': 10001,
        'Object': 10003,
        'FunctionInterface': 10005,
        'DuplicateFunctionInterface': 10005,
        'AnObjectInterface': 10007,
        'ObjectLibrary': 10009,
        'nonObjectLibrary': 10010,
        'FunctionNonInterface': 10011,
        'constant': 3,
      },
      '10001': {  // Function
        'name': 4,
        'prototype': 10002,
      },
      '10002': {  // Function.prootype
        'caller': 7,
        'length': 3,
        'name': 4,
      },
      '10003': {  // Object
        'arguments': 6,
        'caller': 6,
        'prototype': 10004,
      },
      '10004': {  // Object.prototype
        '+constructor+': 10019,
        '+toLocaleString+': 6,
        '+toString+': 6,
        '+valueOf+': 6,
      },
      '10005': {  // FunctionInterface
        'prototype': 10006,
      },
      '10006': {  // FunctionInterface.prototype
        'meaningfulAPI': 6,
        'caller': 7,
        'length': 3,
      },
      '10007': {  // AnObjectInterface
        'prototype': 10008,
        'protoProperty': 10016,
        // AnObjectInterface.protoProperty is __proto__ of
        // FunctionInterface and it cantains meaningfull APIs.
        // Without __proto__ revisiting,
        // FunctionInterface.__proto__ will be missed.
      },
      '10008': {  // AnObjectInterface.prototype
        'meaningfulAPI': 6,
        '+valueOf+': 6,
      },
      '10009': {  // ObjectLibrary
        '+toString+': 6,
        '+valueOf+': 6,
        'functionAPI': 10015,
        'InterfaceInstance': 10013,
        'ObejectInstanceA': 10014,
        'property': 3,
        'constObjectProperty': 7,
        'constantNumber': 3,
      },
      '10010': {  // nonObjectLibrary
        '+toString+': 6,
        '+valueOf+': 6,
        '+constructor+': 6,
        '+toLocaleString+': 6,
      },
      '10011': {  // FunctionNonInterface
        'prototype': 10012,
      },
      '10012': {  // FunctionNonInterface.prototype
        'caller': 7,
        'length': 3,
        'name': 4,
      },
      '10013': {
        'hiddenAPI': 3,
        'notOwnProperty': 3,
      },
      '10014': {
        'hiddenAPI': 3,
      },
      '10015': {  // ObjectLibrary.functionAPI
        'extraProperty': 3,
      },
      '10016': {  // FunctionInterface.__proto__
        'meaningfulAPI': 3,
      },
      '10017': {  // HiddenInterface.prototype
        '+constructor+': 10018,
      },
    },
    'functions': {
      '10001': 'Function',
      '10002': 'function',
      '10003': 'Object',
      '10004': 'object',
      '10005': 'FunctionInterface',
      '10011': 'FunctionNonInterface',
      '10015': 'functionAPI',
      '10016': 'ProtoInterface',
      '10018': 'HiddenInterface',
      '10019': 'Object',
    },
    'metadata': {
      '10000': {  // window
        'Function': {
          'writable': 1,
        },
        'Object': {
          'writable': 1,
        },
        'FunctionInterface': {
          'writable': 1,
        },
        'DuplicateFunctionInterface': {
          'writable': 1,
        },
        'AnObjectInterface': {
          'writable': 1,
        },
        'ObjectLibrary': {
          'writable': 1,
        },
        'nonObjectLibrary': {
          'writable': 1,
        },
        'FunctionNonInterface': {
          'writable': 1,
        },
        'constant': {
          'writable': 0,
        },
      },
      '10001': {  // Function
        'name': {
          'writable': 0,
        },
        'prototype': {
          'writable': 0,
        },
      },
      '10002': {  // Function.prootype
        'constructor': {
          'writable': 1,
        },
        'toString': {
          'writable': 1,
        },
        'caller': {
          'writable': 1,
        },
        'length': {
          'writable': 1,
        },
        'name': {
          'writable': 0,
        },
      },
      '10003': {  // Object
        'arguments': {
          'writable': 1,
        },
        'caller': {
          'writable': 1,
        },
        'prototype': {
          'writable': 1,
        },
      },
      '10004': {  // Object.prototype
        'constructor': {
          'writable': 1,
        },
        'toLocaleString': {
          'writable': 1,
        },
        'toString': {
          'writable': 1,
        },
        'valueOf': {
          'writable': 1,
        },
      },
      '10005': {  // FunctionInterface
        'prototype': {
          'writable': 1,
        },
      },
      '10006': {  // FunctionInterface.prototype
        'meaningfulAPI': {
          'writable': 1,
        },
        'caller': {
          'writable': 1,
        },
        'length': {
          'writable': 1,
        },
      },
      '10007': {  // ObjectInterface
        'prototype': {
          'writable': 1,
        },
        'protoProperty': {
          'writable': 1,
        },
      },
      '10008': {  // ObjectInterface.prototype
        'meaningfulAPI': {
          'writable': 1,
        },
        'valueOf': {
          'writable': 1,
        },
      },
      '10009': {  // ObjectLibrary
        'toString': {
          'writable': 1,
        },
        'valueOf': {
          'writable': 1,
        },
        'InterfaceInstance': {
          'writable': 1,
        },
        'ObejectInstanceA': {
          'writable': 1,
        },
        'functionAPI': {
          'writable': 1,
        },
        'property': {
          'writable': 1,
        },
        'constObjectProperty': {
          'writable': 0,
        },
        'constantProperty': {
          'writable': 0,
        },
      },
      '10010': {  // nonObjectLibrary
        'toString': {
          'writable': 1,
        },
        'valueOf': {
          'writable': 1,
        },
        'constructor': {
          'writable': 1,
        },
        'toLocaleString': {
          'writable': 1,
        },
      },
      '10011': {  // FunctionNonInterface
        'prototype': {
          'writable': 1,
        },
      },
      '10012': {  // FunctionNonInterface.prototype
        'caller': {
          'writable': 1,
        },
        'length': {
          'writable': 1,
        },
        'name': {
          'writable': 1,
        },
      },
      '10013': {
        'hiddenAPI': {
          'writable': 1,
        },
      },
      '10014': {
        'hiddenAPI': {
          'writable': 1,
        },
      },
      '10015': {
        'extraProperty': {
          'writable': 1,
        },
      },
      '10016': {
        'meaningfulAPI': {
          'writable': 1,
        },
      },
      '10017': {
      },
    },
    'protos': {
      '10005': '10016',
      '10013': '10017',
      '10014': '10004',
    },
    'root': 10000,
    'types': {
      'boolean': 2,
      'exception': 7,
      'null': 6,
      'number': 3,
      'string': 4,
      'symbol': 5,
      'undefined': 1,
    },
    'key': 'window',
  });
  let extractor = org.chromium.apis.web.apiExtractor.create({});

  let apiCatalog = extractor.extractWebCatalog(og);

  describe('First level interfaec', function() {
    it('is included if it contains meaningful properties', function() {
      expect(apiCatalog.FunctionNonInterface).toBeUndefined();
      expect(apiCatalog.FunctionInterface).toBeDefined();
      expect(apiCatalog.nonObjectLibrary).toBeUndefined();
      expect(apiCatalog.ObjectLibrary).toBeDefined();
      expect(apiCatalog.AnObjectInterface).toBeDefined();
      expect(apiCatalog.FunctionInterface.sort()).toEqual(
        ['meaningfulAPI'].sort());
      expect(apiCatalog.ObjectLibrary.sort()).toEqual(
        ['functionAPI', 'InterfaceInstance',
        'ObejectInstanceA', 'property', 'constObjectProperty'].sort());
      expect(apiCatalog.AnObjectInterface.sort()).toEqual(
        ['protoProperty', 'meaningfulAPI'].sort());
    });
    it('has separate interfaces even two first level interfaces' +
    ' reference to the same object.', function() {
      expect(apiCatalog.FunctionInterface).toBeDefined();
      expect(apiCatalog.DuplicateFunctionInterface).toBeDefined();
        expect(apiCatalog.DuplicateFunctionInterface.sort()).toEqual(
          apiCatalog.FunctionInterface.sort());
    });
    it('is contained in Window interface as API', function() {
      expect(apiCatalog.Window.sort()).toEqual(['Function', 'Object',
        'FunctionInterface', 'DuplicateFunctionInterface', 'AnObjectInterface',
        'ObjectLibrary', 'nonObjectLibrary', 'FunctionNonInterface',
        'constant'].sort());
    });
  });

  it('extracts api for Object and Function without filtering built-in APIs.',
    function() {
      expect(apiCatalog.Object.sort()).toEqual(['arguments',
        'constructor', 'toLocaleString', 'toString', 'valueOf'].sort());
      expect(apiCatalog.Function.sort()).toEqual([
        'prototype', 'caller', 'length', 'name'].sort());
    });
  it('filters built-in APIs for non-special cases.', function() {
    expect(apiCatalog.FunctionNonInterface).not.toContain('caller');
    expect(apiCatalog.FunctionNonInterface).not.toContain('length');
    expect(apiCatalog.FunctionNonInterface).not.toContain('name');
    expect(apiCatalog.AnObjectInterface).not.toContain('constructor');
    expect(apiCatalog.AnObjectInterface).not.toContain('toString');
    expect(apiCatalog.AnObjectInterface).not.toContain('toLocaleString');
    expect(apiCatalog.AnObjectInterface).not.toContain('valueOf');
    expect(apiCatalog.ObjectLibrary).not.toContain('constructor');
    expect(apiCatalog.ObjectLibrary).not.toContain('toString');
    expect(apiCatalog.ObjectLibrary).not.toContain('toLocaleString');
    expect(apiCatalog.ObjectLibrary).not.toContain('valueOf');
  });
  it('extracts __proto__ as interface if it includes meaningful APIs',
    function() {
      expect(apiCatalog.ProtoInterface).toBeDefined();
      expect(apiCatalog.ProtoInterface).toContain('meaningfulAPI');
    }
  );
  it('adds instances\' api to its class if class is not Object', function() {
    expect(apiCatalog.HiddenInterface).toBeDefined();
    expect(apiCatalog.HiddenInterface).toEqual(['hiddenAPI']);
    // If instances class is Object, do not add it to Object interface.
    expect(apiCatalog.Object).not.toContain('hiddenAPI');
  });
  it('only includes own properties.', function() {
    expect(apiCatalog.HiddenInterface).not.toContain('notwnProperty');
  });
  it('filters out const primitives, but not const objects.', function() {
    expect(apiCatalog.ObjectLibrary).toContain('property');
    expect(apiCatalog.ObjectLibrary).toContain('constObjectProperty');
    expect(apiCatalog.ObjectLibrary).not.toContain('constantNumber');
  });
});
