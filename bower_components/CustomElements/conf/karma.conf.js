module.exports = function(karma) {
  var common = require('../../tools/test/karma-common.conf.js');

  karma.set(common.mixin_common_opts(karma, {
    // base path, that will be used to resolve files and exclude
    basePath: '../../',

    // list of files / patterns to load in the browser
    files: [
      'tools/test/mocha-htmltest.js',
      'CustomElements/conf/mocha.conf.js',
      'CustomElements/../tools/test/chai/chai.js',
      'CustomElements/custom-elements.js',
      'CustomElements/test/js/*.js',
      {pattern: 'CustomElements/src/*', included: false},
      {pattern: 'CustomElements/test/html/*.html', included: false},
      {pattern: 'MutationObservers/*.js', included: false},
      {pattern: 'WeakMap/*.js', included: false},
      {pattern: 'tools/**/*.js', included: false}
    ]
  }));
};
