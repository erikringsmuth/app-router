/**
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

window.Platform = window.Platform || {};
// prepopulate window.logFlags if necessary
window.logFlags = window.logFlags || {};
// process flags
(function(scope){
  // import
  var flags = scope.flags || {};
  // populate flags from location
  location.search.slice(1).split('&').forEach(function(o) {
    o = o.split('=');
    o[0] && (flags[o[0]] = o[1] || true);
  });
  var entryPoint = document.currentScript ||
      document.querySelector('script[src*="platform.js"]');
  if (entryPoint) {
    var a = entryPoint.attributes;
    for (var i = 0, n; i < a.length; i++) {
      n = a[i];
      if (n.name !== 'src') {
        flags[n.name] = n.value || true;
      }
    }
  }
  if (flags.log) {
    flags.log.split(',').forEach(function(f) {
      window.logFlags[f] = true;
    });
  }
  // If any of these flags match 'native', then force native ShadowDOM; any
  // other truthy value, or failure to detect native
  // ShadowDOM, results in polyfill
  flags.shadow = flags.shadow || flags.shadowdom || flags.polyfill;
  if (flags.shadow === 'native') {
    flags.shadow = false;
  } else {
    flags.shadow = flags.shadow || !HTMLElement.prototype.createShadowRoot;
  }

  if (flags.shadow && document.querySelectorAll('script').length > 1) {
    console.warn('platform.js is not the first script on the page. ' +
        'See http://www.polymer-project.org/docs/start/platform.html#setup ' +
        'for details.');
  }

  // CustomElements polyfill flag
  if (flags.register) {
    window.CustomElements = window.CustomElements || {flags: {}};
    window.CustomElements.flags.register = flags.register;
  }

  if (flags.imports) {
    window.HTMLImports = window.HTMLImports || {flags: {}};
    window.HTMLImports.flags.imports = flags.imports;
  }

  // export
  scope.flags = flags;
})(Platform);
