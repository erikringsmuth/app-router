// Copyright 2013 The Polymer Authors. All rights reserved.
// Use of this source code is goverened by a BSD-style
// license that can be found in the LICENSE file.

(function(scope) {
  'use strict';

  var ChildNodeInterface = scope.ChildNodeInterface;
  var Node = scope.wrappers.Node;
  var enqueueMutation = scope.enqueueMutation;
  var mixin = scope.mixin;
  var registerWrapper = scope.registerWrapper;

  var OriginalCharacterData = window.CharacterData;

  function CharacterData(node) {
    Node.call(this, node);
  }
  CharacterData.prototype = Object.create(Node.prototype);
  mixin(CharacterData.prototype, {
    get textContent() {
      return this.data;
    },
    set textContent(value) {
      this.data = value;
    },
    get data() {
      return this.impl.data;
    },
    set data(value) {
      var oldValue = this.impl.data;
      enqueueMutation(this, 'characterData', {
        oldValue: oldValue
      });
      this.impl.data = value;
    }
  });

  mixin(CharacterData.prototype, ChildNodeInterface);

  registerWrapper(OriginalCharacterData, CharacterData,
                  document.createTextNode(''));

  scope.wrappers.CharacterData = CharacterData;
})(window.ShadowDOMPolyfill);
