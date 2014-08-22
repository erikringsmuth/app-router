/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

(function(scope) {
  var CLONE_PROPS = [
    // MouseEvent
    'bubbles',
    'cancelable',
    'view',
    'detail',
    'screenX',
    'screenY',
    'clientX',
    'clientY',
    'ctrlKey',
    'altKey',
    'shiftKey',
    'metaKey',
    'button',
    'relatedTarget',
    // DOM Level 3
    'buttons',
    // PointerEvent
    'pointerId',
    'width',
    'height',
    'pressure',
    'tiltX',
    'tiltY',
    'pointerType',
    'hwTimestamp',
    'isPrimary',
    // event instance
    'type',
    'target',
    'currentTarget',
    'which',
    'pageX',
    'pageY',
    'timeStamp',
    // gesture addons
    'preventTap',
    'tapPrevented',
    '_source'
  ];

  var CLONE_DEFAULTS = [
    // MouseEvent
    false,
    false,
    null,
    null,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null,
    // DOM Level 3
    0,
    // PointerEvent
    0,
    0,
    0,
    0,
    0,
    0,
    '',
    0,
    false,
    // event instance
    '',
    null,
    null,
    0,
    0,
    0,
    0,
    function(){},
    false
  ];

  var HAS_SVG_INSTANCE = (typeof SVGElementInstance !== 'undefined');

  var eventFactory = scope.eventFactory;

  /**
   * This module is for normalizing events. Mouse and Touch events will be
   * collected here, and fire PointerEvents that have the same semantics, no
   * matter the source.
   * Events fired:
   *   - pointerdown: a pointing is added
   *   - pointerup: a pointer is removed
   *   - pointermove: a pointer is moved
   *   - pointerover: a pointer crosses into an element
   *   - pointerout: a pointer leaves an element
   *   - pointercancel: a pointer will no longer generate events
   */
  var dispatcher = {
    pointermap: new scope.PointerMap(),
    eventMap: Object.create(null),
    // Scope objects for native events.
    // This exists for ease of testing.
    eventSources: Object.create(null),
    eventSourceList: [],
    gestures: [],
    // map gesture event -> {listeners: int, index: gestures[int]}
    dependencyMap: {
      // make sure down and up are in the map to trigger "register"
      down: {listeners: 0, index: -1},
      up: {listeners: 0, index: -1}
    },
    gestureQueue: [],
    /**
     * Add a new event source that will generate pointer events.
     *
     * `inSource` must contain an array of event names named `events`, and
     * functions with the names specified in the `events` array.
     * @param {string} name A name for the event source
     * @param {Object} source A new source of platform events.
     */
    registerSource: function(name, source) {
      var s = source;
      var newEvents = s.events;
      if (newEvents) {
        newEvents.forEach(function(e) {
          if (s[e]) {
            this.eventMap[e] = s[e].bind(s);
          }
        }, this);
        this.eventSources[name] = s;
        this.eventSourceList.push(s);
      }
    },
    registerGesture: function(name, source) {
      var obj = Object.create(null);
      obj.listeners = 0;
      obj.index = this.gestures.length;
      for (var i = 0, g; i < source.exposes.length; i++) {
        g = source.exposes[i].toLowerCase();
        this.dependencyMap[g] = obj;
      }
      this.gestures.push(source);
    },
    register: function(element, initial) {
      var l = this.eventSourceList.length;
      for (var i = 0, es; (i < l) && (es = this.eventSourceList[i]); i++) {
        // call eventsource register
        es.register.call(es, element, initial);
      }
    },
    unregister: function(element) {
      var l = this.eventSourceList.length;
      for (var i = 0, es; (i < l) && (es = this.eventSourceList[i]); i++) {
        // call eventsource register
        es.unregister.call(es, element);
      }
    },
    // EVENTS
    down: function(inEvent) {
      this.fireEvent('down', inEvent);
    },
    move: function(inEvent) {
      // pipe move events into gesture queue directly
      inEvent.type = 'move';
      this.fillGestureQueue(inEvent);
    },
    up: function(inEvent) {
      this.fireEvent('up', inEvent);
    },
    cancel: function(inEvent) {
      inEvent.tapPrevented = true;
      this.fireEvent('up', inEvent);
    },
    // LISTENER LOGIC
    eventHandler: function(inEvent) {
      // This is used to prevent multiple dispatch of events from
      // platform events. This can happen when two elements in different scopes
      // are set up to create pointer events, which is relevant to Shadow DOM.

      // TODO(dfreedm): make this check more granular, allow for minimal event generation
      // e.g inEvent._handledByPG['tap'] and inEvent._handledByPG['track'], etc
      if (inEvent._handledByPG) {
        return;
      }
      var type = inEvent.type;
      var fn = this.eventMap && this.eventMap[type];
      if (fn) {
        fn(inEvent);
      }
      inEvent._handledByPG = true;
    },
    // set up event listeners
    listen: function(target, events) {
      for (var i = 0, l = events.length, e; (i < l) && (e = events[i]); i++) {
        this.addEvent(target, e);
      }
    },
    // remove event listeners
    unlisten: function(target, events) {
      for (var i = 0, l = events.length, e; (i < l) && (e = events[i]); i++) {
        this.removeEvent(target, e);
      }
    },
    addEvent: function(target, eventName) {
      target.addEventListener(eventName, this.boundHandler);
    },
    removeEvent: function(target, eventName) {
      target.removeEventListener(eventName, this.boundHandler);
    },
    // EVENT CREATION AND TRACKING
    /**
     * Creates a new Event of type `inType`, based on the information in
     * `inEvent`.
     *
     * @param {string} inType A string representing the type of event to create
     * @param {Event} inEvent A platform event with a target
     * @return {Event} A PointerEvent of type `inType`
     */
    makeEvent: function(inType, inEvent) {
      var e = eventFactory.makePointerEvent(inType, inEvent);
      e.preventDefault = inEvent.preventDefault;
      e.tapPrevented = inEvent.tapPrevented;
      e._target = e._target || inEvent.target;
      return e;
    },
    // make and dispatch an event in one call
    fireEvent: function(inType, inEvent) {
      var e = this.makeEvent(inType, inEvent);
      return this.dispatchEvent(e);
    },
    /**
     * Returns a snapshot of inEvent, with writable properties.
     *
     * @param {Event} inEvent An event that contains properties to copy.
     * @return {Object} An object containing shallow copies of `inEvent`'s
     *    properties.
     */
    cloneEvent: function(inEvent) {
      var eventCopy = Object.create(null), p;
      for (var i = 0; i < CLONE_PROPS.length; i++) {
        p = CLONE_PROPS[i];
        eventCopy[p] = inEvent[p] || CLONE_DEFAULTS[i];
        // Work around SVGInstanceElement shadow tree
        // Return the <use> element that is represented by the instance for Safari, Chrome, IE.
        // This is the behavior implemented by Firefox.
        if (p === 'target' || p === 'relatedTarget') {
          if (HAS_SVG_INSTANCE && eventCopy[p] instanceof SVGElementInstance) {
            eventCopy[p] = eventCopy[p].correspondingUseElement;
          }
        }
      }
      // keep the semantics of preventDefault
      eventCopy.preventDefault = function() {
        inEvent.preventDefault();
      };
      return eventCopy;
    },
    /**
     * Dispatches the event to its target.
     *
     * @param {Event} inEvent The event to be dispatched.
     * @return {Boolean} True if an event handler returns true, false otherwise.
     */
    dispatchEvent: function(inEvent) {
      var t = inEvent._target;
      if (t) {
        t.dispatchEvent(inEvent);
        // clone the event for the gesture system to process
        // clone after dispatch to pick up gesture prevention code
        var clone = this.cloneEvent(inEvent);
        clone.target = t;
        this.fillGestureQueue(clone);
      }
    },
    gestureTrigger: function() {
      // process the gesture queue
      for (var i = 0, e; i < this.gestureQueue.length; i++) {
        e = this.gestureQueue[i];
        for (var j = 0, g, fn; j < this.gestures.length; j++) {
          g = this.gestures[j];
          fn = g[e.type];
          if (g.enabled && fn) {
            fn.call(g, e);
          }
        }
      }
      this.gestureQueue.length = 0;
    },
    fillGestureQueue: function(ev) {
      // only trigger the gesture queue once
      if (!this.gestureQueue.length) {
        requestAnimationFrame(this.boundGestureTrigger);
      }
      this.gestureQueue.push(ev);
    }
  };
  dispatcher.boundHandler = dispatcher.eventHandler.bind(dispatcher);
  dispatcher.boundGestureTrigger = dispatcher.gestureTrigger.bind(dispatcher);
  scope.dispatcher = dispatcher;

  /**
   * Listen for `gesture` on `node` with the `handler` function
   *
   * If `handler` is the first listener for `gesture`, the underlying gesture recognizer is then enabled.
   *
   * @param {Element} node
   * @param {string} gesture
   * @return Boolean `gesture` is a valid gesture
   */
  scope.activateGesture = function(node, gesture) {
    var g = gesture.toLowerCase();
    var dep = dispatcher.dependencyMap[g];
    if (dep) {
      var recognizer = dispatcher.gestures[dep.index];
      if (dep.listeners === 0) {
        if (recognizer) {
          recognizer.enabled = true;
        }
      }
      dep.listeners++;
      if (!node._pgListeners) {
        dispatcher.register(node);
        node._pgListeners = 0;
      }
      // TODO(dfreedm): re-evaluate bookkeeping to avoid using attributes
      if (recognizer) {
        var touchAction = recognizer.defaultActions && recognizer.defaultActions[g];
        var actionNode;
        switch(node.nodeType) {
          case Node.ELEMENT_NODE:
            actionNode = node;
          break;
          case Node.DOCUMENT_FRAGMENT_NODE:
            actionNode = node.host;
          break;
          default:
            actionNode = null;
          break;
        }
        if (touchAction && actionNode && !actionNode.hasAttribute('touch-action')) {
          actionNode.setAttribute('touch-action', touchAction);
        }
      }
      node._pgListeners++;
    }
    return Boolean(dep);
  };

  /**
   *
   * Listen for `gesture` from `node` with `handler` function.
   *
   * @param {Element} node
   * @param {string} gesture
   * @param {Function} handler
   * @param {Boolean} capture
   */
  scope.addEventListener = function(node, gesture, handler, capture) {
    if (handler) {
      scope.activateGesture(node, gesture);
      node.addEventListener(gesture, handler, capture);
    }
  };

  /**
   * Tears down the gesture configuration for `node`
   *
   * If `handler` is the last listener for `gesture`, the underlying gesture recognizer is disabled.
   *
   * @param {Element} node
   * @param {string} gesture
   * @return Boolean `gesture` is a valid gesture
   */
  scope.deactivateGesture = function(node, gesture) {
    var g = gesture.toLowerCase();
    var dep = dispatcher.dependencyMap[g];
    if (dep) {
      if (dep.listeners > 0) {
        dep.listeners--;
      }
      if (dep.listeners === 0) {
        var recognizer = dispatcher.gestures[dep.index];
        if (recognizer) {
          recognizer.enabled = false;
        }
      }
      if (node._pgListeners > 0) {
        node._pgListeners--;
      }
      if (node._pgListeners === 0) {
        dispatcher.unregister(node);
      }
    }
    return Boolean(dep);
  };

  /**
   * Stop listening for `gesture` from `node` with `handler` function.
   *
   * @param {Element} node
   * @param {string} gesture
   * @param {Function} handler
   * @param {Boolean} capture
   */
  scope.removeEventListener = function(node, gesture, handler, capture) {
    if (handler) {
      scope.deactivateGesture(node, gesture);
      node.removeEventListener(gesture, handler, capture);
    }
  };
})(window.PolymerGestures);
