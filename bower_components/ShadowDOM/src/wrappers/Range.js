// Copyright 2013 The Polymer Authors. All rights reserved.
// Use of this source code is goverened by a BSD-style
// license that can be found in the LICENSE file.

(function(scope) {
  'use strict';

  var registerWrapper = scope.registerWrapper;
  var unwrap = scope.unwrap;
  var unwrapIfNeeded = scope.unwrapIfNeeded;
  var wrap = scope.wrap;

  var OriginalRange = window.Range;

  function Range(impl) {
    this.impl = impl;
  }
  Range.prototype = {
    get startContainer() {
      return wrap(this.impl.startContainer);
    },
    get endContainer() {
      return wrap(this.impl.endContainer);
    },
    get commonAncestorContainer() {
      return wrap(this.impl.commonAncestorContainer);
    },
    setStart: function(refNode,offset) {
      this.impl.setStart(unwrapIfNeeded(refNode), offset);
    },
    setEnd: function(refNode,offset) {
      this.impl.setEnd(unwrapIfNeeded(refNode), offset);
    },
    setStartBefore: function(refNode) {
      this.impl.setStartBefore(unwrapIfNeeded(refNode));
    },
    setStartAfter: function(refNode) {
      this.impl.setStartAfter(unwrapIfNeeded(refNode));
    },
    setEndBefore: function(refNode) {
      this.impl.setEndBefore(unwrapIfNeeded(refNode));
    },
    setEndAfter: function(refNode) {
      this.impl.setEndAfter(unwrapIfNeeded(refNode));
    },
    selectNode: function(refNode) {
      this.impl.selectNode(unwrapIfNeeded(refNode));
    },
    selectNodeContents: function(refNode) {
      this.impl.selectNodeContents(unwrapIfNeeded(refNode));
    },
    compareBoundaryPoints: function(how, sourceRange) {
      return this.impl.compareBoundaryPoints(how, unwrap(sourceRange));
    },
    extractContents: function() {
      return wrap(this.impl.extractContents());
    },
    cloneContents: function() {
      return wrap(this.impl.cloneContents());
    },
    insertNode: function(node) {
      this.impl.insertNode(unwrapIfNeeded(node));
    },
    surroundContents: function(newParent) {
      this.impl.surroundContents(unwrapIfNeeded(newParent));
    },
    cloneRange: function() {
      return wrap(this.impl.cloneRange());
    },
    isPointInRange: function(node, offset) {
      return this.impl.isPointInRange(unwrapIfNeeded(node), offset);
    },
    comparePoint: function(node, offset) {
      return this.impl.comparePoint(unwrapIfNeeded(node), offset);
    },
    intersectsNode: function(node) {
      return this.impl.intersectsNode(unwrapIfNeeded(node));
    },
    toString: function() {
      return this.impl.toString();
    }
  };

  // IE9 does not have createContextualFragment.
  if (OriginalRange.prototype.createContextualFragment) {
    Range.prototype.createContextualFragment = function(html) {
      return wrap(this.impl.createContextualFragment(html));
    };
  }

  registerWrapper(window.Range, Range, document.createRange());

  scope.wrappers.Range = Range;

})(window.ShadowDOMPolyfill);
