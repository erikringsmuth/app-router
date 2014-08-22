/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
(function() {

var thisFile = 'custom-elements.js';
var scopeName = 'CustomElements';
var modules = [
  '../MutationObservers/mutation-observers.js',
  'src/Observer.js',
  'src/CustomElements.js',
  'src/Parser.js',
  'src/boot.js'
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
