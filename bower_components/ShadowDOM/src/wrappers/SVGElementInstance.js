// Copyright 2014 The Polymer Authors. All rights reserved.
// Use of this source code is goverened by a BSD-style
// license that can be found in the LICENSE file.

(function(scope) {
  'use strict';

  var EventTarget = scope.wrappers.EventTarget;
  var mixin = scope.mixin;
  var registerWrapper = scope.registerWrapper;
  var wrap = scope.wrap;

  var OriginalSVGElementInstance = window.SVGElementInstance;
  if (!OriginalSVGElementInstance)
    return;

  function SVGElementInstance(impl) {
    EventTarget.call(this, impl);
  }

  SVGElementInstance.prototype = Object.create(EventTarget.prototype);
  mixin(SVGElementInstance.prototype, {
    /** @type {SVGElement} */
    get correspondingElement() {
      return wrap(this.impl.correspondingElement);
    },

    /** @type {SVGUseElement} */
    get correspondingUseElement() {
      return wrap(this.impl.correspondingUseElement);
    },

    /** @type {SVGElementInstance} */
    get parentNode() {
      return wrap(this.impl.parentNode);
    },

    /** @type {SVGElementInstanceList} */
    get childNodes() {
      throw new Error('Not implemented');
    },

    /** @type {SVGElementInstance} */
    get firstChild() {
      return wrap(this.impl.firstChild);
    },

    /** @type {SVGElementInstance} */
    get lastChild() {
      return wrap(this.impl.lastChild);
    },

    /** @type {SVGElementInstance} */
    get previousSibling() {
      return wrap(this.impl.previousSibling);
    },

    /** @type {SVGElementInstance} */
    get nextSibling() {
      return wrap(this.impl.nextSibling);
    }
  });

  registerWrapper(OriginalSVGElementInstance, SVGElementInstance);

  scope.wrappers.SVGElementInstance = SVGElementInstance;
})(window.ShadowDOMPolyfill);
