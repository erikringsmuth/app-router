module.exports = function(karma) {
  var common = require('../tools/test/karma-common.conf.js');
  karma.set(common.mixin_common_opts(karma, {
    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // list of files / patterns to load in the browser
    files: [
      'polymer-gestures/node_modules/chai/chai.js',
      'polymer-gestures/src/scope.js',
      'polymer-gestures/src/targetfind.js',
      'polymer-gestures/src/touch-action.js',
      'polymer-gestures/src/eventFactory.js',
      'polymer-gestures/src/pointermap.js',
      'polymer-gestures/src/dispatcher.js',
      'polymer-gestures/src/mouse.js',
      'polymer-gestures/src/touch.js',
      'polymer-gestures/src/ms.js',
      'polymer-gestures/src/pointer.js',
      'polymer-gestures/src/platform-events.js',
      'polymer-gestures/src/track.js',
      'polymer-gestures/src/tap.js',
      'polymer-gestures/test/setup.js'
    ]
  }));
};
