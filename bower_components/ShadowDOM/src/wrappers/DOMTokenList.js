// Copyright 2014 The Polymer Authors. All rights reserved.
// Use of this source code is goverened by a BSD-style
// license that can be found in the LICENSE file.

(function(scope) {
  'use strict';

  function invalidateClass(el) {
    scope.invalidateRendererBasedOnAttribute(el, 'class');
  }

  function DOMTokenList(impl, ownerElement) {
    this.impl = impl;
    this.ownerElement_ = ownerElement;
  }

  DOMTokenList.prototype = {
    get length() {
      return this.impl.length;
    },
    item: function(index) {
      return this.impl.item(index);
    },
    contains: function(token) {
      return this.impl.contains(token);
    },
    add: function() {
      this.impl.add.apply(this.impl, arguments);
      invalidateClass(this.ownerElement_);
    },
    remove: function() {
      this.impl.remove.apply(this.impl, arguments);
      invalidateClass(this.ownerElement_);
    },
    toggle: function(token) {
      var rv = this.impl.toggle.apply(this.impl, arguments);
      invalidateClass(this.ownerElement_);
      return rv;
    },
    toString: function() {
      return this.impl.toString();
    }
  };

  scope.wrappers.DOMTokenList = DOMTokenList;
})(window.ShadowDOMPolyfill);
