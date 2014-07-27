module.exports = function(karma) {
  var common = require('../../tools/test/karma-common.conf.js');
  karma.configure(common.mixin_common_opts(karma, {
    // base path, that will be used to resolve files and exclude
    basePath: '../../',

    // list of files / patterns to load in the browser
    files: [
      'tools/test/mocha-htmltest.js',
      'HTMLImports/conf/mocha.conf.js',
      'HTMLImports/../tools/test/chai/chai.js',
      'HTMLImports/test/js/*.js',
      'HTMLImports/html-imports.js',
      {pattern: 'tools/**/*.js', included: false},
      {pattern: 'HTMLImports/src/*', included: false},
      {pattern: 'HTMLImports/test/**/*', included: false},
      {pattern: 'MutationObservers/*.js', included: false},
      {pattern: 'WeakMap/*.js', included: false}
    ],
  }));
};
