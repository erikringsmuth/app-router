/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

(function(scope) {

  // so we can call wrap/unwrap without testing for ShadowDOMPolyfill
  window.wrap = window.unwrap = function(n){
    return n;
  }

  addEventListener('DOMContentLoaded', function() {
    if (CustomElements.useNative === false) {
      var originalCreateShadowRoot = Element.prototype.createShadowRoot;
      Element.prototype.createShadowRoot = function() {
        var root = originalCreateShadowRoot.call(this);
        CustomElements.watchShadow(this);
        return root;
      };
    }
  });

  Platform.templateContent = function(inTemplate) {
    // if MDV exists, it may need to boostrap this template to reveal content
    if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap) {
      HTMLTemplateElement.bootstrap(inTemplate);
    }
    // fallback when there is no Shadow DOM polyfill, no MDV polyfill, and no
    // native template support
    if (!inTemplate.content && !inTemplate._content) {
      var frag = document.createDocumentFragment();
      while (inTemplate.firstChild) {
        frag.appendChild(inTemplate.firstChild);
      }
      inTemplate._content = frag;
    }
    return inTemplate.content || inTemplate._content;
  };

})(window.Platform);
