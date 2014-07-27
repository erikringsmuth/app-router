/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function() {

var thisFile = 'mutation-observers.js';
var scopeName = 'MutationObservers';
var modules = [
  '../WeakMap/weakmap.js',
  'MutationObserver.js',
];

// export

window[scopeName] = {
  entryPointName: thisFile,
  modules: modules
};

// bootstrap

var script = document.querySelector('script[src*="' + thisFile + '"]');
var src = script.attributes.src.value;
var basePath = src.slice(0, src.indexOf(thisFile));

if (!window.PolymerLoader) {
  var path = basePath + '../tools/loader/loader.js';
  document.write('<script src="' + path + '"></script>');
}
document.write('<script>PolymerLoader.load("' + scopeName + '")</script>');

})();
