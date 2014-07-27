// Copyright 2014 The Polymer Authors. All rights reserved.
// Use of this source code is goverened by a BSD-style
// license that can be found in the LICENSE file.

(function(scope) {
  'use strict';

  var registerWrapper = scope.registerWrapper;
  var unwrap = scope.unwrap;
  var unwrapIfNeeded = scope.unwrapIfNeeded;
  var wrap = scope.wrap;

  var OriginalSelection = window.Selection;

  function Selection(impl) {
    this.impl = impl;
  }
  Selection.prototype = {
    get anchorNode() {
      return wrap(this.impl.anchorNode);
    },
    get focusNode() {
      return wrap(this.impl.focusNode);
    },
    addRange: function(range) {
      this.impl.addRange(unwrap(range));
    },
    collapse: function(node, index) {
      this.impl.collapse(unwrapIfNeeded(node), index);
    },
    containsNode: function(node, allowPartial) {
      return this.impl.containsNode(unwrapIfNeeded(node), allowPartial);
    },
    extend: function(node, offset) {
      this.impl.extend(unwrapIfNeeded(node), offset);
    },
    getRangeAt: function(index) {
      return wrap(this.impl.getRangeAt(index));
    },
    removeRange: function(range) {
      this.impl.removeRange(unwrap(range));
    },
    selectAllChildren: function(node) {
      this.impl.selectAllChildren(unwrapIfNeeded(node));
    },
    toString: function() {
      return this.impl.toString();
    }
  };

  // WebKit extensions. Not implemented.
  // readonly attribute Node baseNode;
  // readonly attribute long baseOffset;
  // readonly attribute Node extentNode;
  // readonly attribute long extentOffset;
  // [RaisesException] void setBaseAndExtent([Default=Undefined] optional Node baseNode,
  //                       [Default=Undefined] optional long baseOffset,
  //                       [Default=Undefined] optional Node extentNode,
  //                       [Default=Undefined] optional long extentOffset);
  // [RaisesException, ImplementedAs=collapse] void setPosition([Default=Undefined] optional Node node,
  //                  [Default=Undefined] optional long offset);

  registerWrapper(window.Selection, Selection, window.getSelection());

  scope.wrappers.Selection = Selection;

})(window.ShadowDOMPolyfill);
