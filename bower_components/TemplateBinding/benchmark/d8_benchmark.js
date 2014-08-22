// Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
// This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
// The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
// The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
// Code distributed by Google as part of the polymer project is also
// subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt

// Flags: --allow-natives-syntax

var testDiv = document.createElement('div');
var width = 2;
var depth = 4;
var decoration = 8;
var instanceCount = 10;
var oneTime = false;
var compoundBindings = false;
var expressionCheckbox = false;
var bindingDensities = [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1];
var testTypes = ['MDV'];

function benchmarkComplete(results) {
  print('benchmarkComplete');
  print(JSON.stringify(results));
}

function updateStatus(density, testType, runCount) {
  print('updateStatus');
  print(testType + ' ' + (100 * density) +
        '% binding density, ' + runCount + ' runs');
}

var test = new MDVBenchmark(testDiv, width, depth, decoration, instanceCount,
                            oneTime,
                            compoundBindings,
                            expressionCheckbox);

var runner = new BenchmarkRunner(test,
                                 bindingDensities,
                                 testTypes,
                                 benchmarkComplete,
                                 updateStatus);
runner.go();
runTimeouts();
