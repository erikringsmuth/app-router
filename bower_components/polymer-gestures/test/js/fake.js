/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

function Fake() {
}

Fake.prototype = {
  targetAt: function(x, y) {
    return PolymerGestures.targetFinding.searchRoot(document, x, y) || document;
  },
  middleOfNode: function(node) {
    var bcr = node.getBoundingClientRect();
    return {y: bcr.top + (bcr.height / 2), x: bcr.left + (bcr.width / 2)};
  },
  makeEvent: function(type, x, y) {
    var e = document.createEvent('MouseEvent');
    e.initMouseEvent('mouse' + type, true, true, null, null, 0, 0, x, y, false, false, false, false, 0, null);
    return e;
  },
  downOnNode: function(node, done) {
    var xy = this.middleOfNode(node);
    this.downAt(xy.x, xy.y, done);
  },
  downAt: function(x, y, done) {
    this.x = x >>> 0;
    this.y = y >>> 0;
    this.target = this.targetAt(x, y);
    var e = this.makeEvent('down', x, y);
    this.target.dispatchEvent(e);
    done();
  },
  moveToNode: function(node, done, step) {
    var xy = this.middleOfNode(node);
    this.moveTo(xy.x, xy.y, done, step);
  },
  moveTo: function(x, y, done, step) {
    x = x >>> 0;
    y = y >>> 0;
    step = step || 5;
    var dx = (x - this.x) / step;
    var dy = (y - this.y) / step;
    var curX = this.x, curY = this.y;
    var self = this;
    requestAnimationFrame(function fn() {
      var e = self.makeEvent('move', curX, curY);
      self.target.dispatchEvent(e);
      curX = Math.round(curX + dx);
      curY = Math.round(curY + dy);
      if (curX != x && curY != y) {
        requestAnimationFrame(fn);
      } else {
        self.x = curX;
        self.y = curY;
        done();
      }
    });
  },
  upOnNode: function(node, done, moveto) {
    var xy = this.middleOfNode(node);
    this.upAt(xy.x, xy.y, done, moveto);
  },
  upAt: function(x, y, done, moveto) {
    x = x >>> 0;
    y = y >>> 0;
    var self = this;
    if (moveto) {
      this.moveTo(x, y, function() {
        self.upAt(x, y, done);
      });
    } else {
      var e = this.makeEvent('up', x, y);
      this.targetAt(x, y).dispatchEvent(e);
      done();
    }
  }
};
