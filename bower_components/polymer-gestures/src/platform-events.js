/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

/**
 * This module contains the handlers for native platform events.
 * From here, the dispatcher is called to create unified pointer events.
 * Included are touch events (v1), mouse events, and MSPointerEvents.
 */
(function(scope) {
  var dispatcher = scope.dispatcher;
  var nav = window.navigator;

  if (window.PointerEvent) {
    dispatcher.registerSource('pointer', scope.pointerEvents);
  } else if (nav.msPointerEnabled) {
    dispatcher.registerSource('ms', scope.msEvents);
  } else {
    dispatcher.registerSource('mouse', scope.mouseEvents);
    if (window.ontouchstart !== undefined) {
      dispatcher.registerSource('touch', scope.touchEvents);
      /*
       * NOTE: an empty touch listener on body will reactivate nodes imported from templates with touch listeners
       * Removing it will re-break the nodes
       *
       * Work around for https://bugs.webkit.org/show_bug.cgi?id=135628
       */
      var isSafari = nav.userAgent.match('Safari') && !nav.userAgent.match('Chrome');
      if (isSafari) {
        document.body.addEventListener('touchstart', function(){});
      }
    }
  }
  dispatcher.register(document, true);
})(window.PolymerGestures);
