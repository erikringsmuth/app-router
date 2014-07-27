/**
 * Copyright 2014 The Polymer Authors. All rights reserved.
 * Use of this source code is goverened by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {
  'use strict';

  var registerWrapper = scope.registerWrapper;
  var unwrap = scope.unwrap;

  var OriginalFormData = window.FormData;

  function FormData(formElement) {
    this.impl = new OriginalFormData(formElement && unwrap(formElement));
  }

  registerWrapper(OriginalFormData, FormData, new OriginalFormData());

  scope.wrappers.FormData = FormData;

})(window.ShadowDOMPolyfill);
